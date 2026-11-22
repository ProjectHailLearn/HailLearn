import { Request, Response } from 'express';
import crypto from 'crypto';
import { sendEmail } from '../services/emailService.js';
import { User, IUser } from '../models/User.js';
import { Mentor } from '../models/Mentor.js';
import { AuthRequest } from '../middlewares/auth.js';
import { notify } from '../services/notificationService.js';
import { issueSession, rotateRefreshToken, revokeRefreshToken, revokeAllSessions } from '../services/tokenService.js';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

// Emails a fresh 6-digit verification code; only its hash is stored.
const sendVerificationCode = async (user: IUser): Promise<void> => {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  await User.updateOne(
    { _id: user._id },
    { emailOtpHash: hashToken(code), emailOtpExpires: new Date(Date.now() + OTP_TTL_MS), emailOtpAttempts: 0 }
  );
  await sendEmail(
    user.email,
    `Your HailLearn verification code: ${code}`,
    `Hi ${user.name},\n\nYour HailLearn verification code is ${code}. It expires in 10 minutes.\n\nIf you didn't create an account, you can ignore this email.`
  );
};

const needsVerification = (res: Response, email: string, message: string) =>
  res.status(403).json({ success: false, code: 'EMAIL_NOT_VERIFIED', message, data: { email } });

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
  emailVerified: user.emailVerified !== false,
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
    const user = await User.create({ name, email, password, role: safeRole, university, department, semester, emailVerified: false });
    await syncMentorProfile(user);
    await notify(user._id.toString(), {
      type: 'system',
      title: 'Welcome to HailLearn',
      message: 'Ask your first doubt to get an instant AI-guided solution.',
      link: '/doubts',
    });
    await sendVerificationCode(user);

    // No session until the email is verified (FR-1.1); the client shows the code-entry step next.
    res.status(201).json({
      success: true,
      code: 'EMAIL_NOT_VERIFIED',
      message: `We sent a 6-digit code to ${user.email}.`,
      data: { email: user.email, needsVerification: true },
    });
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error('[Register Error]', err);
    res.status(500).json({ success: false, message: `Registration failed: ${errorMsg}`, error: errorMsg });
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

    if (user.suspended) {
      res.status(403).json({ success: false, code: 'ACCOUNT_SUSPENDED', message: `This account is suspended${user.suspendedReason ? `: ${user.suspendedReason}` : ''}.` });
      return;
    }
    if (user.emailVerified === false) {
      await sendVerificationCode(user);
      needsVerification(res, user.email, `Please verify your email first. We sent a new code to ${user.email}.`);
      return;
    }

    const session = await issueSession(user._id.toString(), user.role);
    res.json({ success: true, data: { ...session, user: toPublicUser(user) } });
  } catch (err) {
    const errorMsg = (err as Error).message;
    console.error('[Login Error]', err);
    res.status(500).json({ success: false, message: `Login failed: ${errorMsg}`, error: errorMsg });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email }).select('+emailOtpHash +emailOtpExpires +emailOtpAttempts');
    const invalid = () => res.status(400).json({ success: false, message: 'Invalid or expired code' });
    if (!user) { invalid(); return; }
    if (user.emailVerified) { res.status(400).json({ success: false, message: 'Email is already verified — please sign in.' }); return; }
    if (!user.emailOtpHash || !user.emailOtpExpires || user.emailOtpExpires < new Date()) { invalid(); return; }
    if ((user.emailOtpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      res.status(429).json({ success: false, message: 'Too many wrong codes. Request a new code.' });
      return;
    }
    if (hashToken(String(code)) !== user.emailOtpHash) {
      await User.updateOne({ _id: user._id }, { $inc: { emailOtpAttempts: 1 } });
      invalid();
      return;
    }

    await User.updateOne(
      { _id: user._id },
      { $set: { emailVerified: true }, $unset: { emailOtpHash: '', emailOtpExpires: '', emailOtpAttempts: '' } }
    );
    user.emailVerified = true;
    const session = await issueSession(user._id.toString(), user.role);
    res.json({ success: true, data: { ...session, user: toPublicUser(user) } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to verify email' });
  }
};

// Same response whether or not the account exists, so this can't be used to discover emails.
export const resendVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && user.emailVerified === false) await sendVerificationCode(user);
    res.json({ success: true, message: 'If that account needs verification, a new code has been sent.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to send code' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const result = await rotateRefreshToken(String(req.body.refreshToken)).catch(() => ({ ok: false as const, reason: 'invalid' as const }));
  if (!result.ok) {
    const message = result.reason === 'suspended' ? 'This account is suspended.' : 'Session expired — please sign in again.';
    res.status(401).json({ success: false, code: result.reason === 'suspended' ? 'ACCOUNT_SUSPENDED' : 'SESSION_EXPIRED', message });
    return;
  }
  res.json({ success: true, data: result.session });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  if (typeof req.body?.refreshToken === 'string') await revokeRefreshToken(req.body.refreshToken).catch(() => undefined);
  res.json({ success: true });
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
    const clientBase = process.env.CLIENT_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    const link = `${clientBase}/reset-password?token=${token}`;
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
    user.emailVerified = true; // the reset link proved they own the address
    await user.save();
    await revokeAllSessions(user._id.toString());
    const session = await issueSession(user._id.toString(), user.role);
    res.json({ success: true, data: { ...session, user: toPublicUser(user) } });
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
    // Sign out other devices; this device keeps working until it next refreshes, then signs in again.
    await revokeAllSessions(user._id.toString());
    res.json({ success: true, message: 'Password updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};
