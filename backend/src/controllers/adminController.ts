import { Response } from 'express';
import { User } from '../models/User.js';
import { Mentor } from '../models/Mentor.js';
import { MentorRequest } from '../models/MentorRequest.js';
import { Course } from '../models/Course.js';
import { AuthRequest } from '../middlewares/auth.js';
import { syncMentorProfile } from './authController.js';
import { notify } from '../services/notificationService.js';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role } = req.query;
    const query: Record<string, unknown> = {};
    if (typeof role === 'string' && ['student', 'mentor', 'faculty', 'admin'].includes(role)) query.role = role;
    if (typeof search === 'string' && search.trim()) {
      const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
      query.$or = [{ name: rx }, { email: rx }, { department: rx }];
    }
    const users = await User.find(query).sort({ createdAt: -1 }).limit(200);
    res.json({
      success: true,
      data: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        karmaPoints: u.karmaPoints,
        avatar: u.avatar,
      })),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.userId) {
      res.status(400).json({ success: false, message: 'You cannot change your own role' });
      return;
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    await syncMentorProfile(user);
    await notify(user._id.toString(), {
      type: 'system',
      title: 'Your role was updated',
      message: `An administrator changed your role to ${user.role}. Sign out and back in to apply it.`,
    });
    res.json({ success: true, data: { id: user._id, role: user.role } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update role' });
  }
};

export const listMentorProfiles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mentors = await Mentor.find().sort({ name: 1 });
    const userIds = mentors.map((m) => m.userId).filter(Boolean) as string[];
    const users = await User.find({ _id: { $in: userIds } });
    const emailById = Object.fromEntries(users.map((u) => [u._id.toString(), u.email]));
    res.json({
      success: true,
      data: mentors.map((m) => ({
        id: m._id,
        name: m.name,
        department: m.department,
        userId: m.userId || null,
        linkedEmail: m.userId ? emailById[m.userId] || null : null,
      })),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch mentor profiles' });
  }
};

// Attach a (seeded) mentor profile to a real mentor/faculty account.
export const linkMentorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [mentor, user] = await Promise.all([Mentor.findById(req.params.id), User.findById(req.body.userId)]);
    if (!mentor || !user) { res.status(404).json({ success: false, message: 'Mentor profile or user not found' }); return; }
    if (user.role !== 'mentor' && user.role !== 'faculty') {
      res.status(400).json({ success: false, message: 'Only mentor or faculty accounts can be linked' });
      return;
    }
    if (mentor.userId && mentor.userId !== user._id.toString()) {
      res.status(409).json({ success: false, message: 'This profile is already linked to another account' });
      return;
    }

    const userId = user._id.toString();
    // The account's auto-created profile is replaced; move its requests over first.
    const existing = await Mentor.findOne({ userId, _id: { $ne: mentor._id } });
    if (existing) {
      await MentorRequest.updateMany({ mentorId: existing._id.toString() }, { mentorId: mentor._id.toString(), mentorName: mentor.name });
      await mentor.updateOne({ $inc: { resolvedDoubtsCount: existing.resolvedDoubtsCount, karmaPoints: existing.karmaPoints } });
      await existing.deleteOne();
    }
    await mentor.updateOne({ userId });
    // Pending requests sent to this profile before it was linked now reach the account.
    await MentorRequest.updateMany({ mentorId: mentor._id.toString() }, { mentorUserId: userId });
    await notify(userId, {
      type: 'mentor',
      title: 'Mentor profile linked',
      message: `Your account is now linked to the "${mentor.name}" mentor profile.`,
      link: '/mentorship',
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to link profile', error: (err as Error).message });
  }
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exists = await Course.findOne({ code: req.body.code.toUpperCase() });
    if (exists) { res.status(409).json({ success: false, message: 'A course with this code already exists' }); return; }
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create course', error: (err as Error).message });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code: _code, ...update } = req.body;
    const course = await Course.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!course) { res.status(404).json({ success: false, message: 'Course not found' }); return; }
    res.json({ success: true, data: course });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) { res.status(404).json({ success: false, message: 'Course not found' }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
};
