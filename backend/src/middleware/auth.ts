import { Response, NextFunction } from 'express';
import jwt from 'jwt-simple';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-mvp';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(); // If no token, just continue (routes will check req.user)
  }

  const token = authHeader.split(' ')[1];
  try {
    if (token) {
      const payload = jwt.decode(token, JWT_SECRET);
      req.user = payload;
    }
  } catch (err) {
    // Invalid token, ignore or let routes handle missing req.user
  }
  
  next();
};
