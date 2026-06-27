import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import apiRoutes from './routes/api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jwt-simple';
import { syncSpecialties } from './utils/syncSpecialties';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-mvp';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
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

app.use(cors());
app.use(express.json());

// Apply limiters to generic routes as example (would be scoped in a real router)
app.use('/api/auth', authLimiter, authRoutes);
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
  let systemInstructionContext = "You are 'Pulse', an AI triage assistant. Do not provide official medical diagnoses, but do ask clarifying questions about symptoms and suggest whether the user should see a doctor.\n\n";

  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          reports: { include: { MedicalReportSummary: true, MedicalReportValue: true }, orderBy: { reportDate: 'desc' }, take: 5 },
          prescriptions: { include: { prescriptionAnalysis: true }, orderBy: { createdAt: 'desc' }, take: 5 },
        }
      });

      if (user) {
        systemInstructionContext += `Patient Profile:\n`;
        systemInstructionContext += `- Name: ${user.name}\n`;
        if (user.age) systemInstructionContext += `- Age: ${user.age}\n`;
        if (user.gender) systemInstructionContext += `- Gender: ${user.gender}\n`;
        if (user.weight) systemInstructionContext += `- Weight: ${user.weight}\n`;
        if (user.bloodGroup) systemInstructionContext += `- Blood Group: ${user.bloodGroup}\n`;
        if (user.medicalConditions) systemInstructionContext += `- Medical Conditions: ${user.medicalConditions}\n`;
        systemInstructionContext += `\n`;

        const reports = user.reports.filter(r => r.MedicalReportSummary || r.MedicalReportValue.length > 0);
        if (reports.length > 0) {
          systemInstructionContext += `[Uploaded Medical Reports]:\n`;
          reports.forEach(r => {
            systemInstructionContext += `- Report Type: ${r.reportType} (Date: ${r.reportDate.toISOString().split('T')[0]})\n`;
            if (r.MedicalReportSummary) systemInstructionContext += `  Summary: ${r.MedicalReportSummary.healthSummary}\n`;
            const abnormals = r.MedicalReportValue.filter(v => v.isAbnormal);
            if (abnormals.length > 0) {
              systemInstructionContext += `  Abnormalities detected: ${abnormals.map(a => `${a.key} (${a.value} ${a.unit})`).join(', ')}\n`;
            }
          });
          systemInstructionContext += `\n`;
        }

        const prescriptions = user.prescriptions.filter(p => p.prescriptionAnalysis.length > 0);
        if (prescriptions.length > 0) {
          systemInstructionContext += `[Uploaded Prescriptions/Medications]:\n`;
          prescriptions.forEach(p => {
            systemInstructionContext += `- Medication List (from ${p.createdAt.toISOString().split('T')[0]}):\n`;
            p.prescriptionAnalysis.forEach(med => {
              systemInstructionContext += `  * ${med.medicineName}: ${med.dosage} (${med.simplifiedExplanation})\n`;
            });
          });
          systemInstructionContext += `\n`;
        }
      }
    } catch (err) {
      console.error('[Socket.io] Failed to load user context:', err);
    }
  }

  systemInstructionContext += `
YOUR STRICT RULES:
1. You have NO prior knowledge of this patient unless stated in the patient profile or history above. Do not invent details.
2. NEVER make a definitive diagnosis.
3. If the user reports a symptom, ask 2-3 clarifying questions to narrow it down (e.g. onset, pain levels, duration).
4. Always gently remind them that you are an AI assistant and recommend checking with a qualified healthcare provider.
`;

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Pulse Backend running on port ${PORT}`);
  await syncSpecialties();
});
