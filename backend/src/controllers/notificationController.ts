import { Response } from 'express';
import { Notification } from '../models/Notification.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true },
      { new: true }
    );
    if (!item) { res.status(404).json({ success: false, message: 'Notification not found' }); return; }
    res.json({ success: true, data: item });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await Notification.updateMany({ userId: req.userId, read: false }, { read: true });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notifications' });
  }
};
