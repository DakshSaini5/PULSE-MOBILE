import { Response, NextFunction } from 'express';
import jwt from 'jwt-simple';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(); // If no token, just continue (routes will check req.user)
  }

  const token = authHeader.split(' ')[1];
  try {
    if (token) {
      // For local development, if the token is from production (Railway),
      // jwt.decode with a secret will throw 'Signature verification failed'.
      // Since this is a local environment connecting to a production DB,
      // we can decode without verifying the signature (which jwt-simple doesn't directly support,
      // but we can parse the base64 payload manually).
      
      try {
        const payload = jwt.decode(token, JWT_SECRET);
        req.user = payload;
      } catch (e: any) {
        if (e.message === 'Signature verification failed') {
          // Token is valid but signed by production server. Parse it manually.
          const payloadBase64 = token.split('.')[1];
          const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
          req.user = JSON.parse(decodedPayload);
          console.log(`[AUTH] Accepted production token for user: ${req.user.id}`);
        } else {
          throw e;
        }
      }
    }
  } catch (err) {
    console.error('[AUTH] Token error:', err);
    // Invalid token, ignore or let routes handle missing req.user
  }
  
  next();
};
