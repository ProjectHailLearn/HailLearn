import { Response } from 'express';
import { Doubt } from '../models/Doubt.js';
import { Mentor } from '../models/Mentor.js';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [byStatus, byCourse, onlineMentors, knowledgeItems, myDoubts, user] = await Promise.all([
      Doubt.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Doubt.aggregate<{ _id: string; count: number }>([
        { $match: { status: { $ne: 'CLOSED' } } },
        { $group: { _id: '$courseCode', count: { $sum: 1 } } },
      ]),
      Mentor.countDocuments({ isOnline: true }),
      KnowledgeItem.countDocuments(),
      Doubt.countDocuments({ 'author.id': req.userId }),
      User.findById(req.userId),
    ]);

    const karma = user?.karmaPoints ?? 0;
    const [usersAbove, totalUsers] = await Promise.all([
      User.countDocuments({ karmaPoints: { $gt: karma } }),
      User.countDocuments(),
    ]);

    const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.count])) as Record<string, number>;
    const total = byStatus.reduce((sum, s) => sum + s.count, 0);
    const aiResolved = statusCounts.AI_RESOLVED || 0;
    const resolved = aiResolved + (statusCounts.FACULTY_VERIFIED || 0) + (statusCounts.CLOSED || 0);

    res.json({
      success: true,
      data: {
        totalDoubts: total,
        resolved,
        aiResolutionRate: total ? Math.round((aiResolved / total) * 1000) / 10 : 0,
        escalated: statusCounts.MENTOR_ESCALATED || 0,
        verified: statusCounts.FACULTY_VERIFIED || 0,
        onlineMentors,
        knowledgeItems,
        myDoubts,
        karmaPoints: karma,
        karmaRank: usersAbove + 1,
        totalUsers,
        doubtsByCourse: Object.fromEntries(byCourse.map((c) => [c._id, c.count])),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};
