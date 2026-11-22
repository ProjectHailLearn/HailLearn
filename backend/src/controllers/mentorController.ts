import { Request, Response } from 'express';
import { Mentor } from '../models/Mentor.js';
import { AuthRequest } from '../middlewares/auth.js';
import { isOnline } from '../services/presenceService.js';
import { isWithinSlots } from '../services/availabilityService.js';

type MentorDoc = InstanceType<typeof Mentor>;

const withStatus = (m: MentorDoc) => ({
  ...m.toObject(),
  isOnline: isOnline(m.lastSeenAt),
  availableNow: isOnline(m.lastSeenAt) || isWithinSlots(m.availability),
  hasAccount: !!m.userId,
});

export const getMentors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mentors = await Mentor.find().sort({ reputationScore: -1, karmaPoints: -1 });
    res.json({ success: true, data: mentors.map(withStatus) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch mentors' });
  }
};

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const m = await Mentor.findById(req.params.id);
    if (!m) { res.status(404).json({ success: false, message: 'Mentor not found' }); return; }
    res.json({ success: true, data: { ...m.availability?.toObject?.() ?? m.availability, availableNow: isOnline(m.lastSeenAt) || isWithinSlots(m.availability) } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
};

// The mentor themself (or an admin) sets weekly slots and whether they take routed doubts.
export const updateAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const m = await Mentor.findById(req.params.id);
    if (!m) { res.status(404).json({ success: false, message: 'Mentor not found' }); return; }
    if (m.userId !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'You can only change your own availability' });
      return;
    }
    const updated = await Mentor.findByIdAndUpdate(m._id, { $set: { availability: req.body } }, { new: true, runValidators: true });
    res.json({ success: true, data: updated?.availability });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update availability', error: (err as Error).message });
  }
};

// The signed-in user's own mentor profile (for the Settings page), or 404 for non-mentors.
export const getMyMentorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const m = await Mentor.findOne({ userId: req.userId });
  if (!m) { res.status(404).json({ success: false, message: 'No mentor profile' }); return; }
  res.json({ success: true, data: withStatus(m) });
};
