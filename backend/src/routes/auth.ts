import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jwt-simple';
import { prisma } from '../index';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-mvp';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: { email: identifier }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.encode({ id: user.id }, JWT_SECRET);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, mobileNumber, password, code } = req.body;
  try {
    // Basic MVP: ignore OTP code verification for now to speed up MVP
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const names = name.split(' ');
    
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'User'
      }
    });

    const token = jwt.encode({ id: newUser.id }, JWT_SECRET);
    res.json({ token, user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.decode(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Mocks for other endpoints
router.post('/register/send-otp', (req, res) => {
  res.json({ message: 'OTP Sent' });
});

import jsonwebtoken from 'jsonwebtoken';

router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'No token provided' });
  }

  try {
    const decoded = jsonwebtoken.decode(token) as any;
    if (!decoded || !decoded.email) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }

    const { email, name, picture } = decoded;

    let user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Google User',
          authProvider: 'GOOGLE',
          avatar: picture || null,
        }
      });
    }

    const sessionToken = jwt.encode({ id: user.id }, JWT_SECRET);
    res.json({ token: sessionToken, user });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ error: 'Server error processing Google auth' });
  }
});

router.post('/check-mobile', (req, res) => {
  res.json({ exists: false });
});

// Custom Google Auth Proxy for Expo Go
router.get('/google/proxy', (req, res) => {
  res.send(`
    <html>
      <head><title>Authenticating...</title></head>
      <body>
        <h2>Finishing Google Login...</h2>
        <script>
          const hash = window.location.hash || window.location.search;
          
          // Expo Go sometimes strips URL fragments (#), so we convert it to a query string (?)
          const queryParams = hash.replace('#', '?');
          
          const returnUrl = "exp://192.168.1.3:8081/--/googleauth";
          
          const deepLink = returnUrl + queryParams;
          window.location.href = deepLink;
        </script>
      </body>
    </html>
  `);
});

export default router;
