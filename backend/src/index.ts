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

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

// Socket.io Real-Time Chat Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  let chatSession: any = null;

  socket.on('chatMessage', async (msg) => {
    if (isAiDisabled) {
      socket.emit('chatError', { message: 'AI is temporarily disabled due to billing/rate limit issues.' });
      return;
    }
    
    try {
      if (!chatSession) {
        chatSession = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: "You are Pulse AI, a medical assistant. Do not provide official medical diagnoses, but do ask clarifying questions about symptoms and suggest whether the user should see a doctor." }],
            },
            {
              role: "model",
              parts: [{ text: "Understood. I am Pulse AI. I will assist with medical inquiries without diagnosing." }],
            }
          ]
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
server.listen(PORT, () => {
  console.log(`Pulse Backend running on port ${PORT}`);
});
