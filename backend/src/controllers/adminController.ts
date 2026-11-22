import { Response } from 'express';
import { indexMentorByUserId, reindex } from '../search/indexers.js';
import { Doubt } from '../models/Doubt.js';
import { Message } from '../models/Message.js';
import { Rating } from '../models/Rating.js';
import { Flag } from '../models/Flag.js';
import { sendEmail } from '../services/emailService.js';
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
        suspended: !!u.suspended,
        suspendedReason: u.suspendedReason,
        emailVerified: u.emailVerified !== false,
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
    await indexMentorByUserId(userId).catch(() => undefined);
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

// ---------- account suspension (FR-6.1) ----------

export const suspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.params.id === req.userId) { res.status(400).json({ success: false, message: 'You cannot suspend yourself' }); return; }
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim().slice(0, 300) : '';
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { suspended: true, suspendedReason: reason || undefined, refreshTokens: [] } }, { new: true });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    // Hide a suspended mentor from routing and the online list straight away.
    await Mentor.updateOne({ userId: user._id.toString() }, { $set: { 'availability.acceptingDoubts': false }, $unset: { lastSeenAt: '' } });
    await sendEmail(user.email, 'Your HailLearn account was suspended',
      `Hi ${user.name},\n\nAn administrator suspended your HailLearn account${reason ? ` for this reason: ${reason}` : ''}.\nReply to this email if you think this is a mistake.`);
    res.json({ success: true, data: { id: user._id, suspended: true } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to suspend user' });
  }
};

export const unsuspendUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { suspended: false }, $unset: { suspendedReason: '' } }, { new: true });
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    await Mentor.updateOne({ userId: user._id.toString() }, { $set: { 'availability.acceptingDoubts': true } });
    await notify(user._id.toString(), { type: 'system', title: 'Account restored', message: 'An administrator lifted the suspension on your account.' });
    res.json({ success: true, data: { id: user._id, suspended: false } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to restore user' });
  }
};

// ---------- mentor badge verification ----------

export const setMentorBadge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const verified = !!req.body.verified;
    const mentor = await Mentor.findByIdAndUpdate(req.params.id, { $set: { verifiedBadge: verified } }, { new: true });
    if (!mentor) { res.status(404).json({ success: false, message: 'Mentor not found' }); return; }
    if (mentor.userId && verified) {
      await notify(mentor.userId, { type: 'system', title: 'Verified mentor badge', message: 'An administrator verified your mentor profile. The badge now shows on your profile.' });
    }
    res.json({ success: true, data: { id: mentor._id, verifiedBadge: mentor.verifiedBadge } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update badge' });
  }
};

// ---------- chat transcripts (moderation) ----------

export const listConversations = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const requests = await MentorRequest.find({ status: 'ACCEPTED' }).sort({ updatedAt: -1 }).limit(200).lean<
      { _id: unknown; studentName: string; mentorName: string; topic?: string; updatedAt: Date }[]
    >();
    const counts = await Message.aggregate<{ _id: string; n: number; last: Date }>([
      { $group: { _id: '$requestId', n: { $sum: 1 }, last: { $max: '$createdAt' } } },
    ]);
    const byId = new Map(counts.map((c) => [c._id, c]));
    res.json({
      success: true,
      data: requests.map((r) => ({
        id: String(r._id), studentName: r.studentName, mentorName: r.mentorName, topic: r.topic,
        messageCount: byId.get(String(r._id))?.n ?? 0, lastMessageAt: byId.get(String(r._id))?.last ?? r.updatedAt,
      })),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

export const getTranscript = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await Message.find({ requestId: req.params.id }).sort({ createdAt: 1 }).limit(1000);
    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch transcript' });
  }
};

// ---------- analytics (FR-6.2) ----------

export const getAnalytics = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [usersByRole, byStatus, perDay, bySubject, routing, confidence, response, ratings, topMentors, openFlags, suspended] = await Promise.all([
      User.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$role', n: { $sum: 1 } } }]),
      Doubt.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Doubt.aggregate<{ _id: string; n: number }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Doubt.aggregate<{ _id: string; n: number; open: number }>([
        { $group: { _id: '$subject', n: { $sum: 1 }, open: { $sum: { $cond: [{ $in: ['$status', ['AI_RESOLVED', 'MENTOR_ESCALATED', 'ANALYZING']] }, 1, 0] } } } },
        { $sort: { n: -1 } },
        { $limit: 10 },
      ]),
      Doubt.aggregate<{ _id: string | null; n: number }>([{ $group: { _id: '$routing.mode', n: { $sum: 1 } } }]),
      Doubt.aggregate<{ avg: number }>([{ $match: { aiConfidenceScore: { $type: 'number' } } }, { $group: { _id: null, avg: { $avg: '$aiConfidenceScore' } } }]),
      Doubt.aggregate<{ avg: number; n: number }>([
        { $match: { acceptedAt: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: { $divide: [{ $subtract: ['$acceptedAt', '$createdAt'] }, 60000] } }, n: { $sum: 1 } } },
      ]),
      Rating.aggregate<{ _id: string; n: number; clarity: number; helpfulness: number; responseTime: number }>([
        { $group: { _id: '$target', n: { $sum: 1 }, clarity: { $avg: '$clarity' }, helpfulness: { $avg: '$helpfulness' }, responseTime: { $avg: '$responseTime' } } },
      ]),
      Mentor.find({ userId: { $exists: true, $nin: [null, ''] } }, { name: 1, reputationScore: 1, ratingsCount: 1, resolvedDoubtsCount: 1, avgResponseMinutes: 1, verifiedBadge: 1 })
        .sort({ reputationScore: -1 }).limit(5).lean(),
      Flag.countDocuments({ status: 'open' }),
      User.countDocuments({ suspended: true }),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.n])) as Record<string, number>;
    const total = byStatus.reduce((s, x) => s + x.n, 0);
    const resolved = (statusCounts.AI_RESOLVED ?? 0) + (statusCounts.FACULTY_VERIFIED ?? 0) + (statusCounts.CLOSED ?? 0);
    const routed = routing.find((r) => r._id === 'mentor_routing')?.n ?? 0;
    const gated = routing.filter((r) => r._id).reduce((s, r) => s + r.n, 0);
    const round = (n: number | undefined, d = 1) => (n === undefined ? null : Math.round(n * 10 ** d) / 10 ** d);

    res.json({
      success: true,
      data: {
        users: { total: usersByRole.reduce((s, r) => s + r.n, 0), byRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.n])), suspended },
        doubts: {
          total,
          byStatus: statusCounts,
          resolutionRate: total ? round((resolved / total) * 100) : 0,
          perDay,
          bySubject: bySubject.map((s) => ({ subject: s._id, total: s.n, open: s.open })),
        },
        ai: {
          avgConfidence: round(confidence[0]?.avg),
          answeredByAi: gated - routed,
          routedToMentors: routed,
          routingRate: gated ? round((routed / gated) * 100) : null,
        },
        mentors: {
          avgResponseMinutes: round(response[0]?.avg, 0),
          acceptedDoubts: response[0]?.n ?? 0,
          top: topMentors,
        },
        ratings: Object.fromEntries(ratings.map((r) => [r._id, { count: r.n, clarity: round(r.clarity, 2), helpfulness: round(r.helpfulness, 2), responseTime: round(r.responseTime, 2) }])),
        moderation: { openReports: openFlags },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to compute analytics', error: (err as Error).message });
  }
};

export const reindexSearch = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [vault, mentors] = await Promise.all([reindex('vault'), reindex('mentors')]);
    res.json({ success: true, data: { vault, mentors } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Reindex failed', error: (err as Error).message });
  }
};
