import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { AuthRequest } from '../middlewares/auth.js';

const signToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, university, department, semester } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    const user = await User.create({ name, email, password, role, university, department, semester });
    const token = signToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          university: user.university,
          department: user.department,
          semester: user.semester,
          karmaPoints: user.karmaPoints,
          avatar: user.avatar,
          specializations: user.specializations,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration failed', error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password required' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = signToken(user._id.toString(), user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          university: user.university,
          department: user.department,
          semester: user.semester,
          karmaPoints: user.karmaPoints,
          avatar: user.avatar,
          specializations: user.specializations,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed', error: (err as Error).message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          university: user.university,
          department: user.department,
          semester: user.semester,
          karmaPoints: user.karmaPoints,
          avatar: user.avatar,
          specializations: user.specializations,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};
