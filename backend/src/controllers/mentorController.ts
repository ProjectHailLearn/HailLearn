import { Request, Response } from 'express';
import { Mentor } from '../models/Mentor.js';
import { isOnline } from '../services/presenceService.js';

export const getMentors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mentors = await Mentor.find().sort({ karmaPoints: -1 });
    res.json({
      success: true,
      data: mentors.map((m) => ({ ...m.toObject(), isOnline: isOnline(m.lastSeenAt), hasAccount: !!m.userId })),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch mentors' });
  }
};
