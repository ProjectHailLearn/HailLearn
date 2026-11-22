import { Response } from 'express';
import { Flag } from '../models/Flag.js';
import { Doubt } from '../models/Doubt.js';
import { Message } from '../models/Message.js';
import { MentorRequest } from '../models/MentorRequest.js';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { AuthRequest } from '../middlewares/auth.js';
import { removeDocument } from '../search/engine.js';

type Target = 'doubt' | 'answer' | 'message' | 'knowledge';

// Finds the flagged content and returns a text snapshot, or null if it doesn't exist (or the reporter
// can't see it, e.g. a message in someone else's chat).
const loadTarget = async (type: Target, id: string, parentId: string | undefined, userId: string): Promise<string | null> => {
  if (type === 'doubt') {
    const d = await Doubt.findById(id);
    return d ? `${d.title}\n${d.description}` : null;
  }
  if (type === 'answer') {
    const d = parentId ? await Doubt.findById(parentId) : null;
    const a = d?.answers.find((x: { _id?: unknown }) => String(x._id) === id);
    return a ? `${a.authorName}: ${a.content}` : null;
  }
  if (type === 'message') {
    const m = await Message.findById(id);
    if (!m) return null;
    const r = await MentorRequest.findById(m.requestId);
    const participant = r && (r.studentId === userId || r.mentorUserId === userId);
    return participant ? `${m.senderName}: ${m.content}` : null;
  }
  const k = await KnowledgeItem.findById(id);
  return k ? `${k.title}\n${k.snippet}` : null;
};

// Any signed-in user can report content (FR-6.1).
export const createFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetType, targetId, parentId, reason } = req.body as { targetType: Target; targetId: string; parentId?: string; reason: string };
    const preview = await loadTarget(targetType, targetId, parentId, req.userId!);
    if (preview === null) { res.status(404).json({ success: false, message: 'Content not found' }); return; }
    const existing = await Flag.findOne({ targetType, targetId, reporterId: req.userId, status: 'open' });
    if (existing) { res.json({ success: true, data: existing, message: 'You already reported this' }); return; }
    const flag = await Flag.create({ targetType, targetId, parentId, reason, preview: preview.slice(0, 1000), reporterId: req.userId });
    res.status(201).json({ success: true, data: flag, message: 'Reported — an administrator will review it.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to report content', error: (err as Error).message });
  }
};

export const listFlags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = typeof req.query.status === 'string' && ['open', 'dismissed', 'removed'].includes(req.query.status) ? req.query.status : 'open';
    const flags = await Flag.find({ status }).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: flags });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

// Admin decision: dismiss the report, or remove the content (other open reports on it close too).
export const resolveFlag = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const flag = await Flag.findById(req.params.id);
    if (!flag) { res.status(404).json({ success: false, message: 'Report not found' }); return; }
    const action = req.body.action as 'dismiss' | 'remove';

    if (action === 'remove') {
      if (flag.targetType === 'doubt') await Doubt.deleteOne({ _id: flag.targetId });
      if (flag.targetType === 'answer' && flag.parentId) await Doubt.updateOne({ _id: flag.parentId }, { $pull: { answers: { _id: flag.targetId } } });
      if (flag.targetType === 'message') await Message.deleteOne({ _id: flag.targetId });
      if (flag.targetType === 'knowledge') {
        await KnowledgeItem.deleteOne({ _id: flag.targetId });
        await removeDocument('vault', flag.targetId);
      }
    }
    const status = action === 'remove' ? 'removed' : 'dismissed';
    const scope = action === 'remove' ? { targetType: flag.targetType, targetId: flag.targetId, status: 'open' } : { _id: flag._id };
    await Flag.updateMany(scope, { $set: { status, resolvedBy: req.userId, resolvedAt: new Date() } });
    res.json({ success: true, data: { id: flag._id, status } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resolve report', error: (err as Error).message });
  }
};
