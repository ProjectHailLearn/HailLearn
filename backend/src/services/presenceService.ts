import { Mentor } from '../models/Mentor.js';
import { emitToAll } from '../socket/index.js';

// A mentor is online if their client sent a heartbeat (or held a socket) within this window.
// Clients heartbeat every 30s, so one missed beat doesn't flip them offline.
export const ONLINE_WINDOW_MS = 75_000;

const onlineCutoff = (): Date => new Date(Date.now() - ONLINE_WINDOW_MS);

export const onlineMentorFilter = () => ({ lastSeenAt: { $gt: onlineCutoff() } });

export const isOnline = (lastSeenAt: Date | null | undefined): boolean => !!lastSeenAt && lastSeenAt > onlineCutoff();

// Records activity for the user's mentor profile (if any) and pushes a presence event when they come online.
export const markSeen = async (userId: string): Promise<void> => {
  const before = await Mentor.findOneAndUpdate({ userId }, { lastSeenAt: new Date() });
  if (before && !isOnline(before.lastSeenAt)) {
    emitToAll('mentors:presence', { mentorId: before._id.toString(), isOnline: true });
  }
};

export const markOffline = async (userId: string): Promise<void> => {
  const before = await Mentor.findOneAndUpdate({ userId }, { $unset: { lastSeenAt: '' } });
  if (before && isOnline(before.lastSeenAt)) {
    emitToAll('mentors:presence', { mentorId: before._id.toString(), isOnline: false });
  }
};
