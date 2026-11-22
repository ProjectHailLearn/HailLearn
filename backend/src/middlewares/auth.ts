import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { jwtSecret } from '../services/tokenService.js';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'No token provided' });
    return;
  }

  let decoded: { userId: string; role: string };
  try {
    decoded = jwt.verify(auth.replace('Bearer ', ''), jwtSecret()) as { userId: string; role: string };
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
    return;
  }

  // Suspension and role changes take effect immediately, not when the access token expires.
  try {
    const user = await User.findById(decoded.userId).select('role suspended').lean<{ role: string; suspended?: boolean }>();
    if (!user) {
      res.status(401).json({ success: false, message: 'Account no longer exists' });
      return;
    }
    if (user.suspended) {
      res.status(403).json({ success: false, code: 'ACCOUNT_SUSPENDED', message: 'This account is suspended.' });
      return;
    }
    req.userId = decoded.userId;
    req.userRole = user.role;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ success: false, message: 'You do not have permission for this action' });
      return;
    }
    next();
  };

// Rejects malformed :id params with 400 instead of letting Mongoose throw a CastError (500).
export const validateObjectId = (_req: Request, res: Response, next: NextFunction, id: string): void => {
  if (!/^[a-f\d]{24}$/i.test(id)) {
    res.status(400).json({ success: false, message: 'Invalid id' });
    return;
  }
  next();
};
