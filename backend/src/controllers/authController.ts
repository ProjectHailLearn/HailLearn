import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService.js';
import { User, IUser } from '../models/User.js';
import { Mentor } from '../models/Mentor.js';
import { AuthRequest } from '../middlewares/auth.js';
import { notify } from '../services/notificationService.js';

const signToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

const toPublicUser = (user: IUser) => ({
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
  preferences: user.preferences,
});

// Mentor/faculty users get a Mentor profile so students can find and request them.
export const syncMentorProfile = async (user: IUser): Promise<void> => {
  if (user.role !== 'mentor' && user.role !== 'faculty') return;
  await Mentor.findOneAndUpdate(
    { userId: user._id.toString() },
    {
      $set: {
        name: user.name,
        avatar: user.avatar,
        department: user.department,
        specializations: user.specializations,
        karmaPoints: user.karmaPoints,
      },
      $setOnInsert: {
        year: user.role === 'faculty' ? 'Faculty Mentor' : 'Peer Mentor',
        isOnline: false,
        bio: `${user.name} mentors students in ${user.department}.`,
      },
    },
    { upsert: true }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, university, department, semester } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' });
      return;
    }

    // Admin cannot be self-assigned at signup.
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase());
    const safeRole = adminEmails.includes(String(email).toLowerCase())
      ? 'admin'
      : ['student', 'mentor', 'faculty'].includes(role) ? role : 'student';
    const user = await User.create({ name, email, password, role: safeRole, university, department, semester });
    await syncMentorProfile(user);
    await notify(user._id.toString(), {
      type: 'system',
      title: 'Welcome to HailLearn',
      message: 'Ask your first doubt to get an instant AI-guided solution.',
      link: '/doubts',
    });
    const token = signToken(user._id.toString(), user.role);

    res.status(201).json({ success: true, data: { token, user: toPublicUser(user) } });
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
    res.json({ success: true, data: { token, user: toPublicUser(user) } });
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
    res.json({ success: true, data: { user: toPublicUser(user) } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, department, semester, university, avatar, specializations, preferences } = req.body;
    const update: Record<string, unknown> = {};
    if (typeof name === 'string' && name.trim()) update.name = name.trim();
    if (typeof department === 'string') update.department = department;
    if (typeof university === 'string') update.university = university;
    if (typeof avatar === 'string') update.avatar = avatar;
    if (semester !== undefined && semester !== '') update.semester = Number(semester);
    if (Array.isArray(specializations)) update.specializations = specializations.map(String);
    if (preferences && typeof preferences === 'object') {
      if (typeof preferences.aiModel === 'string') update['preferences.aiModel'] = preferences.aiModel;
      if (typeof preferences.emailNotifications === 'boolean')
        update['preferences.emailNotifications'] = preferences.emailNotifications;
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true, runValidators: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    await syncMentorProfile(user);
    res.json({ success: true, data: { user: toPublicUser(user) } });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update profile', error: (err as Error).message });
  }
};

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

// Always responds the same way so the endpoint can't be used to discover accounts.
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const generic = { success: true, message: 'If that email is registered, a reset link has been sent.' };
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) { res.json(generic); return; }

    const token = crypto.randomBytes(32).toString('hex');
    await User.updateOne(
      { _id: user._id },
      { passwordResetHash: hashToken(token), passwordResetExpires: new Date(Date.now() + 60 * 60000) }
    );
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await sendEmail(
      user.email,
      'Reset your HailLearn password',
      `Hi ${user.name},\n\nReset your password using this link (valid for 1 hour):\n${link}\n\nIf you didn't request this, you can ignore this email.`
    );
    res.json(generic);
  } catch {
    res.status(500).json({ success: false, message: 'Failed to start password reset' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      passwordResetHash: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetHash +passwordResetExpires');
    if (!user) {
      res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });
      return;
    }
    user.password = password;
    user.passwordResetHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    const jwtToken = signToken(user._id.toString(), user.role);
    res.json({ success: true, data: { token: jwtToken, user: toPublicUser(user) } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};
