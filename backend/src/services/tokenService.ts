import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export const jwtSecret = (): string => process.env.JWT_SECRET || 'dev_haillearn_jwt_secret_key_2026_super_secure';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 5; // signed-in devices per user; the oldest is dropped beyond this

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

// Short-lived access token (default 15 minutes) sent as a Bearer header on every request.
export const signAccessToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, jwtSecret(), { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' } as jwt.SignOptions);

export interface Session {
  token: string; // access token
  refreshToken: string;
}

// Opaque refresh token "<userId>.<random>": only its SHA-256 hash is stored, so a database leak can't be replayed.
export const issueSession = async (userId: string, role: string): Promise<Session> => {
  const refreshToken = `${userId}.${crypto.randomBytes(32).toString('hex')}`;
  const user = await User.findById(userId).select('+refreshTokens');
  const now = Date.now();
  const kept = ((user?.refreshTokens ?? []) as { hash: string; expiresAt: Date }[]).filter((t) => t.expiresAt.getTime() > now).slice(-(MAX_SESSIONS - 1));
  await User.updateOne(
    { _id: userId },
    { $set: { refreshTokens: [...kept, { hash: sha256(refreshToken), expiresAt: new Date(now + REFRESH_TTL_MS) }] } }
  );
  return { token: signAccessToken(userId, role), refreshToken };
};

export type RefreshResult = { ok: true; session: Session } | { ok: false; reason: 'invalid' | 'reused' | 'suspended' };

// Rotation: each refresh token works once. Presenting an already-used token signals theft, so every
// session for that user is revoked and they must sign in again.
export const rotateRefreshToken = async (raw: string): Promise<RefreshResult> => {
  const userId = raw.split('.')[0];
  if (!/^[a-f\d]{24}$/i.test(userId)) return { ok: false, reason: 'invalid' };
  const hash = sha256(raw);

  const user = await User.findOneAndUpdate(
    { _id: userId, refreshTokens: { $elemMatch: { hash, expiresAt: { $gt: new Date() } } } },
    { $pull: { refreshTokens: { hash } } }
  );
  if (!user) {
    const exists = await User.exists({ _id: userId });
    if (exists) await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
    return { ok: false, reason: exists ? 'reused' : 'invalid' };
  }
  if (user.suspended) return { ok: false, reason: 'suspended' };
  return { ok: true, session: await issueSession(userId, user.role) };
};

export const revokeRefreshToken = async (raw: string): Promise<void> => {
  const userId = raw.split('.')[0];
  if (!/^[a-f\d]{24}$/i.test(userId)) return;
  await User.updateOne({ _id: userId }, { $pull: { refreshTokens: { hash: sha256(raw) } } });
};

export const revokeAllSessions = async (userId: string): Promise<void> => {
  await User.updateOne({ _id: userId }, { $set: { refreshTokens: [] } });
};
