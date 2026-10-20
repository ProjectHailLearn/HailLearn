import { Response } from 'express';
import { Doubt } from '../models/Doubt.js';
import { User } from '../models/User.js';
import { Mentor } from '../models/Mentor.js';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { AuthRequest } from '../middlewares/auth.js';
import { solveDoubt } from '../services/aiService.js';
import { notify } from '../services/notificationService.js';

const STATUSES = ['ANALYZING', 'AI_RESOLVED', 'MENTOR_ESCALATED', 'FACULTY_VERIFIED', 'CLOSED'];

export const getDoubts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, mine, courseCode, search } = req.query;
    const query: Record<string, unknown> = {};
    if (typeof status === 'string' && STATUSES.includes(status)) query.status = status;
    if (mine === 'true') query['author.id'] = req.userId;
    if (typeof courseCode === 'string' && courseCode) query.courseCode = courseCode;
    if (typeof search === 'string' && search.trim()) {
      const rx = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      query.$or = [{ title: rx }, { description: rx }, { tags: rx }];
    }
    const doubts = await Doubt.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: doubts });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch doubts' });
  }
};

export const getDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    res.json({ success: true, data: doubt });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch doubt' });
  }
};

export const createDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, codeSnippet, subject, courseCode, tags, depth } = req.body;
    if (!title || !description || !subject || !courseCode) {
      res.status(400).json({ success: false, message: 'title, description, subject and courseCode are required' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const { aiSolution, aiConfidenceScore, source } = await solveDoubt({
      title, description, codeSnippet, subject, courseCode, university: user.university,
      preferredModel: user.preferences?.aiModel,
      depth,
    });

    const doubt = await Doubt.create({
      title,
      description,
      codeSnippet,
      subject,
      courseCode,
      tags: Array.isArray(tags) && tags.length ? tags : [subject.split(' ')[0], courseCode],
      status: 'AI_RESOLVED',
      author: { id: user._id.toString(), name: user.name, avatar: user.avatar, department: user.department },
      aiSolution,
      aiConfidenceScore,
      upvotes: 0,
      views: 1,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { karmaPoints: 2 } });
    await notify(user._id.toString(), {
      type: 'ai',
      title: source === 'fallback' ? 'Doubt received' : 'AI solved your doubt',
      message: `"${title}" — ${source === 'fallback' ? 'a guided outline is ready; escalate for a mentor answer.' : `solution ready (${aiConfidenceScore}% confidence).`}`,
      link: `/doubts?id=${doubt._id}`,
    });

    res.status(201).json({ success: true, data: doubt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create doubt', error: (err as Error).message });
  }
};

export const upvoteDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doubt = await Doubt.findOneAndUpdate(
      { _id: req.params.id, upvotedBy: { $ne: req.userId } },
      { $inc: { upvotes: 1 }, $push: { upvotedBy: req.userId } },
      { new: true }
    );
    if (!doubt) {
      const exists = await Doubt.findById(req.params.id);
      if (!exists) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
      res.json({ success: true, data: exists, message: 'Already upvoted' });
      return;
    }
    res.json({ success: true, data: doubt });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to upvote' });
  }
};

export const escalateDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mentorId = String(req.body.mentorId || '');
    if (!/^[a-f\d]{24}$/i.test(mentorId)) { res.status(400).json({ success: false, message: 'Valid mentorId is required' }); return; }
    const mentor = await Mentor.findById(mentorId);
    if (!mentor) { res.status(404).json({ success: false, message: 'Mentor not found' }); return; }

    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      {
        status: 'MENTOR_ESCALATED',
        assignedMentor: { id: mentor._id.toString(), name: mentor.name, avatar: mentor.avatar, karma: mentor.karmaPoints },
      },
      { new: true }
    );
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }

    await notify(mentor.userId, {
      type: 'mentor',
      title: 'New doubt assigned to you',
      message: `${doubt.author.name} escalated "${doubt.title}" (${doubt.courseCode}).`,
      link: `/doubts?id=${doubt._id}`,
    });
    await notify(doubt.author.id, {
      type: 'mentor',
      title: 'Escalated to mentor',
      message: `${mentor.name} has been assigned to "${doubt.title}".`,
      link: `/doubts?id=${doubt._id}`,
    });
    res.json({ success: true, data: doubt });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to escalate doubt' });
  }
};

export const answerDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content) { res.status(400).json({ success: false, message: 'Answer content is required' }); return; }

    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const existing = await Doubt.findById(req.params.id);
    if (!existing) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    if (existing.status === 'CLOSED') { res.status(400).json({ success: false, message: 'Doubt is closed' }); return; }

    const update: Record<string, unknown> = {
      $push: {
        answers: { authorId: user._id.toString(), authorName: user.name, authorAvatar: user.avatar, role: user.role, content },
      },
    };
    if (existing.status === 'ANALYZING' || existing.status === 'AI_RESOLVED') update.$set = { status: 'MENTOR_ESCALATED' };

    const doubt = await Doubt.findByIdAndUpdate(req.params.id, update, { new: true });
    await User.findByIdAndUpdate(user._id, { $inc: { karmaPoints: 10 } });
    await Mentor.findOneAndUpdate({ userId: user._id.toString() }, { $inc: { resolvedDoubtsCount: 1, karmaPoints: 10 } });
    await notify(existing.author.id, {
      type: 'mentor',
      title: 'New answer on your doubt',
      message: `${user.name} answered "${existing.title}".`,
      link: `/doubts?id=${existing._id}`,
    });
    res.json({ success: true, data: doubt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to answer doubt', error: (err as Error).message });
  }
};

export const verifyDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    const doubt = await Doubt.findByIdAndUpdate(req.params.id, { status: 'FACULTY_VERIFIED' }, { new: true });
    if (!doubt || !user) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }

    // Verified doubts become institutional knowledge.
    const lastAnswer = doubt.answers[doubt.answers.length - 1];
    const snippet = (lastAnswer?.content || doubt.aiSolution?.summary || doubt.description).slice(0, 500);
    await KnowledgeItem.findOneAndUpdate(
      { title: doubt.title, courseCode: doubt.courseCode },
      {
        $set: {
          category: doubt.subject,
          author: lastAnswer?.authorName || user.name,
          verificationBadge: true,
          tags: doubt.tags,
          snippet,
        },
        $setOnInsert: { upvotes: doubt.upvotes, views: doubt.views },
      },
      { upsert: true }
    );
    if (lastAnswer) await User.findByIdAndUpdate(lastAnswer.authorId, { $inc: { karmaPoints: 15 } });

    await notify(doubt.author.id, {
      type: 'course',
      title: 'Faculty verified your doubt',
      message: `"${doubt.title}" was verified by ${user.name} and added to the Knowledge Vault.`,
      link: '/knowledge',
    });
    res.json({ success: true, data: doubt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to verify doubt', error: (err as Error).message });
  }
};

export const closeDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await Doubt.findById(req.params.id);
    if (!existing) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    const isStaff = req.userRole === 'faculty' || req.userRole === 'admin';
    if (existing.author.id !== req.userId && !isStaff) {
      res.status(403).json({ success: false, message: 'Only the author or faculty can close this doubt' });
      return;
    }
    existing.status = 'CLOSED';
    await existing.save();
    res.json({ success: true, data: existing });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to close doubt' });
  }
};
