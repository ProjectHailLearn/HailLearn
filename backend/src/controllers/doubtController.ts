import { Response } from 'express';
import { Doubt, IDoubt } from '../models/Doubt.js';
import { User } from '../models/User.js';
import { Mentor } from '../models/Mentor.js';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { AuthRequest } from '../middlewares/auth.js';
import { runDoubtPipeline, pipelineFields, notifyPipelineOutcome } from '../services/doubtPipeline.js';
import { indexKnowledgeItem, indexMentorByUserId } from '../search/indexers.js';
import { notify } from '../services/notificationService.js';
import { knowledgeContentFromDoubt } from '../utils/knowledge.js';
import { Rating } from '../models/Rating.js';
import { Flag } from '../models/Flag.js';
import { rankMentorsForDoubt, MentorCandidate } from '../services/routingService.js';
import { recomputeMentorReputation, applyQualityFeedback } from '../services/reputationService.js';

const STATUSES = ['ANALYZING', 'AI_RESOLVED', 'MENTOR_ESCALATED', 'FACULTY_VERIFIED', 'CLOSED'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const getDoubts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, mine, courseCode, search } = req.query;
    const query: Record<string, unknown> = {};
    if (typeof status === 'string' && STATUSES.includes(status)) query.status = status;
    if (mine === 'true') query['author.id'] = req.userId;
    if (typeof courseCode === 'string' && courseCode) query.courseCode = courseCode;
    if (typeof req.query.difficulty === 'string' && DIFFICULTIES.includes(req.query.difficulty)) query.difficulty = req.query.difficulty;
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
    const { title, description, codeSnippet, subject, courseCode, tags, depth, difficulty } = req.body;
    if (!title || !description || !subject || !courseCode) {
      res.status(400).json({ success: false, message: 'title, description, subject and courseCode are required' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }

    const result = await runDoubtPipeline(
      { title, description, codeSnippet, subject, courseCode, depth },
      { id: user._id.toString(), university: user.university, preferredModel: user.preferences?.aiModel }
    );
    const doubt = await Doubt.create({
      title,
      description,
      codeSnippet,
      subject,
      courseCode,
      difficulty: difficulty ?? 'Medium',
      tags: Array.isArray(tags) && tags.length ? tags : [subject.split(' ')[0], courseCode],
      author: { id: user._id.toString(), name: user.name, avatar: user.avatar, department: user.department },
      ...pipelineFields(result),
      upvotes: 0,
      views: 1,
    });

    await User.findByIdAndUpdate(user._id, { $inc: { karmaPoints: 2 } });
    await notifyPipelineOutcome(result, { id: String(doubt._id), title, courseCode, authorId: user._id.toString() });
    res.status(201).json({ success: true, data: doubt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create doubt', error: (err as Error).message });
  }
};

// Re-runs the RAG pipeline on an existing doubt (e.g. after the Knowledge Vault has grown). Allowed for
// the author and for mentors/faculty/admins, and only before a mentor has accepted or faculty verified it.
export const resolveWithAi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    const isAuthor = doubt.author.id === req.userId;
    if (!isAuthor && !['mentor', 'faculty', 'admin'].includes(req.userRole ?? '')) {
      res.status(403).json({ success: false, message: 'Only the author or a mentor can re-run the AI' });
      return;
    }
    if (['FACULTY_VERIFIED', 'CLOSED'].includes(doubt.status) || doubt.acceptedBy) {
      res.status(409).json({ success: false, message: 'This doubt is already being handled by a mentor or is resolved' });
      return;
    }
    const author = await User.findById(doubt.author.id);
    const result = await runDoubtPipeline(
      { title: doubt.title, description: doubt.description, codeSnippet: doubt.codeSnippet, subject: doubt.subject, courseCode: doubt.courseCode },
      { id: doubt.author.id, university: author?.university, preferredModel: author?.preferences?.aiModel }
    );
    const fields = pipelineFields(result);
    const updated = await Doubt.findByIdAndUpdate(
      doubt._id,
      { $set: fields, ...(result.routedTo ? {} : { $unset: { assignedMentor: '' } }) },
      { new: true }
    );
    await notifyPipelineOutcome(result, { id: String(doubt._id), title: doubt.title, courseCode: doubt.courseCode, authorId: doubt.author.id });
    res.json({ success: true, data: updated, mode: result.routing.mode });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to run the AI', error: (err as Error).message });
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
    // Answered doubts are part of the mentor's expertise profile used for routing.
    await indexMentorByUserId(user._id.toString()).catch(() => undefined);
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
    const published = await KnowledgeItem.findOneAndUpdate(
      { title: doubt.title, courseCode: doubt.courseCode },
      {
        $set: {
          category: doubt.subject,
          author: lastAnswer?.authorName || user.name,
          verificationBadge: true,
          tags: doubt.tags,
          snippet,
          content: knowledgeContentFromDoubt(doubt),
          doubtId: doubt._id.toString(),
        },
        $setOnInsert: { upvotes: doubt.upvotes, views: doubt.views },
      },
      { upsert: true, new: true }
    );
    if (published) await indexKnowledgeItem(String(published._id)).catch((err) => console.error('[search] index failed:', err.message));
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

// ---------- mentor accept / decline (Mentor & Reputation module) ----------

export const acceptDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const me = await Mentor.findOne({ userId: req.userId });
    if (!me) { res.status(403).json({ success: false, message: 'Only mentors with a mentor profile can accept doubts' }); return; }
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    if (doubt.status !== 'MENTOR_ESCALATED') { res.status(409).json({ success: false, message: 'Only doubts waiting for a mentor can be accepted' }); return; }
    if (doubt.assignedMentor && doubt.assignedMentor.id !== String(me._id) && req.userRole !== 'admin') {
      res.status(403).json({ success: false, message: `This doubt is assigned to ${doubt.assignedMentor.name}` });
      return;
    }

    // Atomic: two mentors accepting at once can't both win.
    const updated = await Doubt.findOneAndUpdate(
      { _id: doubt._id, acceptedBy: { $exists: false } },
      {
        $set: {
          acceptedBy: { userId: req.userId, mentorId: String(me._id), name: me.name },
          acceptedAt: new Date(),
          assignedMentor: { id: String(me._id), name: me.name, avatar: me.avatar, karma: me.karmaPoints },
        },
      },
      { new: true }
    );
    if (!updated) { res.status(409).json({ success: false, message: 'Another mentor already accepted this doubt' }); return; }

    await notify(doubt.author.id, {
      type: 'mentor',
      title: 'A mentor accepted your doubt',
      message: `${me.name} is working on "${doubt.title}".`,
      link: `/doubts?id=${doubt._id}`,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to accept doubt', error: (err as Error).message });
  }
};

// The assigned mentor passes; the doubt goes to the next-best mentor who hasn't declined it.
export const declineDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const me = await Mentor.findOne({ userId: req.userId });
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    if (!me || doubt.assignedMentor?.id !== String(me._id) || doubt.acceptedBy) {
      res.status(403).json({ success: false, message: 'Only the assigned mentor can decline before accepting' });
      return;
    }

    const declined = [...new Set([...(doubt.declinedBy ?? []), req.userId!])];
    let candidates: MentorCandidate[] = (doubt.routing?.candidates ?? []) as MentorCandidate[];
    if (!candidates.some((c) => !declined.includes(c.userId))) {
      candidates = await rankMentorsForDoubt(`${doubt.title}\n${doubt.description}`, doubt.courseCode, doubt.author.id).catch(() => []);
    }
    const next = candidates.find((c) => !declined.includes(c.userId));

    const updated = await Doubt.findByIdAndUpdate(
      doubt._id,
      next
        ? { $set: { declinedBy: declined, assignedMentor: { id: next.mentorId, name: next.name, avatar: next.avatar, karma: next.karma } } }
        : { $set: { declinedBy: declined }, $unset: { assignedMentor: '' } },
      { new: true }
    );
    const link = `/doubts?id=${doubt._id}`;
    if (next) {
      await notify(next.userId, { type: 'mentor', title: 'New doubt routed to you', message: `"${doubt.title}" (${doubt.courseCode}) needs a mentor. Open it to accept.`, link });
    }
    await notify(doubt.author.id, {
      type: 'mentor',
      title: next ? 'Routed to another mentor' : 'Mentor unavailable',
      message: next ? `"${doubt.title}" was passed to ${next.name}.` : `No other mentor is available for "${doubt.title}" right now — try escalating to someone manually.`,
      link,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to decline doubt', error: (err as Error).message });
  }
};

// ---------- resolution confirmation and rating (FR-5.1, FR-5.2) ----------

export const confirmResolution = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    if (doubt.author.id !== req.userId) { res.status(403).json({ success: false, message: 'Only the student who asked can confirm the resolution' }); return; }
    if (doubt.rating) { res.status(409).json({ success: false, message: 'You already rated this doubt' }); return; }

    const { clarity, helpfulness, responseTime, comment } = req.body as { clarity: number; helpfulness: number; responseTime: number; comment?: string };
    const mentorAnswers = (doubt.answers as IDoubt['answers']).filter((a) => ['mentor', 'faculty', 'admin'].includes(a.role));
    const target: 'mentor' | 'ai' = mentorAnswers.length || doubt.acceptedBy ? 'mentor' : 'ai';
    const mentorUserId = doubt.acceptedBy?.userId ?? mentorAnswers[mentorAnswers.length - 1]?.authorId;
    const mentor = mentorUserId ? await Mentor.findOne({ userId: mentorUserId }) : null;
    const respondedAt = doubt.acceptedAt ?? mentorAnswers[0]?.createdAt;
    const responseMinutes = target === 'mentor' && respondedAt
      ? Math.max(0, Math.round((new Date(respondedAt).getTime() - new Date(doubt.createdAt).getTime()) / 60000))
      : undefined;
    const citedSourceIds = ((doubt.retrievedSources ?? []) as NonNullable<IDoubt['retrievedSources']>).filter((s) => s.used).map((s) => s.id);

    await Rating.create({
      doubtId: String(doubt._id), studentId: req.userId, target,
      mentorUserId: target === 'mentor' ? mentorUserId : undefined,
      mentorId: target === 'mentor' && mentor ? String(mentor._id) : undefined,
      clarity, helpfulness, responseTime, responseMinutes, comment, citedSourceIds,
    });
    const updated = await Doubt.findByIdAndUpdate(
      doubt._id,
      { $set: { status: 'CLOSED', resolvedAt: new Date(), rating: { target, clarity, helpfulness, responseTime, comment } } },
      { new: true }
    );

    let reputation: { reputationScore: number; ratingsCount: number } | undefined;
    if (target === 'mentor' && mentor) {
      reputation = await recomputeMentorReputation(String(mentor._id));
      await notify(mentor.userId, {
        type: 'mentor',
        title: 'You received a rating',
        message: `"${doubt.title}": helpfulness ${helpfulness}/5, clarity ${clarity}/5. Reputation now ${reputation.reputationScore.toFixed(2)}.`,
        link: `/doubts?id=${doubt._id}`,
      });
    }
    // The AI's sources get credit or blame for an AI-only resolution.
    if (target === 'ai' && citedSourceIds.length) await applyQualityFeedback(citedSourceIds, helpfulness);
    // Automated moderation: an AI answer rated unhelpful is queued for review.
    if (target === 'ai' && helpfulness <= 2) {
      await Flag.create({
        targetType: 'doubt', targetId: String(doubt._id), automatic: true,
        reason: `AI answer rated ${helpfulness}/5 for helpfulness${comment ? `: "${comment}"` : ''}`,
        preview: doubt.aiSolution?.summary ?? doubt.title,
      });
    }
    res.json({ success: true, data: updated, reputation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to confirm resolution', error: (err as Error).message });
  }
};
