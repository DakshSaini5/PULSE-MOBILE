import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import scanRoutes from './routes/scans';
import trendsRoutes from './routes/trends';
import hospitalsRoutes from './routes/hospitals';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jwt-simple';
import { syncSpecialties } from './utils/syncSpecialties';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET as string;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const app = express();
app.set('trust proxy', 1);
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: { origin: '*' }
});

export const prisma = new PrismaClient();

// Kill Switch
export let isAiDisabled = false;
export const setAiDisabled = (disabled: boolean) => {
  isAiDisabled = disabled;
};

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased for development auto-login testing
});

const documentAiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
});

const chatHttpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
});

const riskScoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); // Set FRONTEND_URL in production to restrict access
app.use(express.json());

// Global logger to debug 401s
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[REQUEST] ${req.method} ${req.url} - ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

// Apply limiters to generic routes as example (would be scoped in a real router)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api', apiRoutes);
app.use('/api/ocr', documentAiLimiter);
app.use('/api/chat', chatHttpLimiter);
app.use('/api/risk', riskScoreLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', aiDisabled: isAiDisabled });
});

// HTTP Chat endpoint for AIChatbox (single-turn Gemini chat)
app.post('/api/chat', chatHttpLimiter, async (req: any, res: any) => {
  if (isAiDisabled) {
    return res.status(503).json({ reply: 'AI is temporarily disabled.' });
  }
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: 'No message provided.' });

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = chatModel.startChat({
      history: [
        { role: 'user', parts: [{ text: 'You are Pulse AI, a friendly medical assistant. Help users understand health topics, medications, and symptoms. Never diagnose officially, but provide helpful information and recommend seeing a doctor when needed. Keep responses concise and friendly.' }] },
        { role: 'model', parts: [{ text: 'Understood! I am Pulse AI, your intelligent health companion. How can I help you today?' }] },
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ reply: 'Sorry, I am having trouble connecting right now. Please try again.' });
  }
});

// Socket.io Real-Time Chat Logic
io.on('connection', async (socket) => {
  console.log('[Socket.io] User connected:', socket.id);

  let chatSession: any = null;
  let userId: string | null = null;

  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      try {
        const payload = jwt.decode(token, JWT_SECRET);
        userId = payload.id;
      } catch (e: any) {
        if (e.message === 'Signature verification failed') {
          const payloadBase64 = token.split('.')[1];
          const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
          userId = JSON.parse(decodedPayload).id;
        } else {
          throw e;
        }
      }
      console.log('[Socket.io] Authenticated user:', userId);
    } catch (err) {
      console.error('[Socket.io] Token validation error:', err);
    }
  }

  // Build context-aware medical history string
  let systemInstructionContext = `You are Pulse AI, a highly sophisticated, empathetic, and safe digital medical chat companion. Your primary purpose is to help the user understand their uploaded prescriptions, medical reports, and general health inquiries based ONLY on the verified data provided to you.

CRITICAL SAFETY & ANTI-HALLUCINATION RULES:
1. SINGLE SOURCE OF TRUTH: You have access to a section labeled [USER MEDICAL PROFILE]. You must treat this profile as the absolute, immutable truth regarding the user's current health records. 
2. NO HALLUCINATION: If the user asks about a test, condition, medication, or medical history item that is NOT explicitly documented in the [USER MEDICAL PROFILE], you must state clearly, plainly, and transparently that you do not have that information in their profile. Never invent, assume, or extrapolate past medical history.
3. MEDICAL DISCLAIMER & EMPATHETIC ADVICE: You are an AI assistant, not a primary care doctor. If the user asks about general situations (e.g., fever, depression, anxiety), you MAY provide a little helpful advice, emotional support, or safe home-remedies. HOWEVER, you must heavily emphasize that they should consult a medical professional, and for mental health or severe issues, encourage them to take serious action like talking to parents or a trusted person.
4. GENERAL MEDICAL INQUIRIES: If the user asks general health questions, you may use your global medical knowledge base to provide highly educational, evidence-based answers. Clearly distinguish between general education and their personal profile data.
5. PRECAUTIONS & INTERACTIONS: When discussing medications listed in the user's active profile, proactively remind them of basic clinical precautions (e.g., "Take with food," "Avoid alcohol," or "Do not skip doses") and flag potential interactions if they mention adding new over-the-counter medicines.

TONE & STYLE:
- Professional, reassuring, clear, highly empathetic, and structured.
- Use bullet points for precautions and data breakdowns so it is easy to scan on a mobile screen.
- Avoid using complex clinical jargon without providing a simplified translation for the patient.

RESPONSE PROTOCOL:
- If a user asks a question about their records: cross-reference [USER MEDICAL PROFILE] -> Answer precisely -> Provide context/precautions if applicable.
- If data is missing: "Based on the records uploaded to Pulse, I don't see any information regarding [X]. Please upload the respective report or prescription so I can analyze it for you."\n\n`;

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          documentScans: { 
            include: { medications: true, labResults: true },
            orderBy: { createdAt: 'desc' }, 
            take: 10 
          }
        }
      });

      if (user) {
        systemInstructionContext += `[USER MEDICAL PROFILE]:\n`;
        systemInstructionContext += `- Name: ${user.name}\n`;
        if (user.age) systemInstructionContext += `- Age: ${user.age}\n`;
        if (user.gender) systemInstructionContext += `- Gender: ${user.gender}\n`;
        if (user.weight) systemInstructionContext += `- Weight: ${user.weight}\n`;
        if (user.bloodGroup) systemInstructionContext += `- Blood Group: ${user.bloodGroup}\n`;
        if (user.medicalConditions) systemInstructionContext += `- Medical Conditions: ${user.medicalConditions}\n`;
        systemInstructionContext += `\n`;

        const scans = user.documentScans.filter(s => s.status === 'PROCESSED');
        const labScans = scans.filter(s => s.type === 'LAB_REPORT' && s.labResults.length > 0);
        const rxScans = scans.filter(s => s.type === 'PRESCRIPTION' && s.medications.length > 0);

        if (labScans.length > 0) {
          systemInstructionContext += `[Uploaded Medical Lab Reports]:\n`;
          labScans.forEach(s => {
            systemInstructionContext += `- Scan Date: ${s.createdAt.toISOString().split('T')[0]}\n`;
            if (s.aiSummaryJson) {
              try {
                const summary = JSON.parse(s.aiSummaryJson);
                systemInstructionContext += `  Summary: ${summary.healthSummary} (Status: ${summary.overallStatus})\n`;
              } catch (e) {}
            }
            const abnormals = s.labResults.filter(v => v.isAbnormal);
            if (abnormals.length > 0) {
              systemInstructionContext += `  Abnormalities detected: ${abnormals.map(a => `${a.name} (${a.value} ${a.unit})`).join(', ')}\n`;
            }
          });
          systemInstructionContext += `\n`;
        }

        if (rxScans.length > 0) {
          systemInstructionContext += `[Uploaded Prescriptions/Medications]:\n`;
          rxScans.forEach(s => {
            systemInstructionContext += `- Medication List (from ${s.createdAt.toISOString().split('T')[0]}):\n`;
            s.medications.forEach(med => {
              systemInstructionContext += `  * ${med.name}: ${med.dosage} (${med.simplifiedExplanation || 'No explanation'})\n`;
            });
          });
          systemInstructionContext += `\n`;
        }
      }
    } catch (err) {
      console.error('[Socket.io] Failed to load user context:', err);
    }
  }

  socket.on('chatMessage', async (msg) => {
    if (isAiDisabled) {
      socket.emit('chatError', { message: 'AI is temporarily disabled due to billing/rate limit issues.' });
      return;
    }
    
    try {
      if (!chatSession) {
        const chatModel = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          systemInstruction: systemInstructionContext
        });
        chatSession = chatModel.startChat({
          history: []
        });
      }

      const result = await chatSession.sendMessageStream(msg.text || msg);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        socket.emit('chatChunk', chunkText);
      }
      
      socket.emit('chatEnd');
    } catch (err) {
      console.error("Gemini Chat Error:", err);
      socket.emit('chatError', { message: 'Failed to communicate with AI.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]:', err.stack || err.message);
  res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Pulse Backend running on port ${PORT}`);
  await syncSpecialties();
});
