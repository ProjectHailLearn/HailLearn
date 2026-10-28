import { Response } from 'express';
import { KnowledgeItem } from '../models/KnowledgeItem.js';
import { AuthRequest } from '../middlewares/auth.js';
import { searchVault } from '../services/retrievalService.js';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getKnowledgeItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query;
    const query: Record<string, unknown> = {};

    if (typeof category === 'string' && category && category !== 'ALL') query.category = category;
    const q = typeof search === 'string' ? search.trim() : '';
    const toJson = (i: InstanceType<typeof KnowledgeItem>, similarityScore?: number) => ({
      ...i.toObject(), similarityScore, hasUpvoted: i.upvotedBy.includes(req.userId!), upvotedBy: undefined,
    });

    if (!q) {
      const items = await KnowledgeItem.find(query).sort({ upvotes: -1 });
      res.json({ success: true, data: items.map((i) => toJson(i)) });
      return;
    }

    // Ranked search (same BM25 retrieval the AI uses), plus plain substring hits for things like course codes.
    const ranked = await searchVault(q);
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    const substring = await KnowledgeItem.find({ ...query, $or: [{ title: rx }, { snippet: rx }, { tags: rx }, { courseCode: rx }] }, { _id: 1 });
    const ids = [...new Set([...ranked.map((r) => r.id), ...substring.map((d) => String(d._id))])];
    const items = await KnowledgeItem.find({ ...query, _id: { $in: ids } });
    const order = new Map(ids.map((id, i) => [id, i]));
    const match = new Map(ranked.map((r) => [r.id, r.match]));
    items.sort((a, b) => (order.get(String(a._id)) ?? 0) - (order.get(String(b._id)) ?? 0));
    res.json({ success: true, data: items.map((i) => toJson(i, match.get(String(i._id)))) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch knowledge items' });
  }
};

export const getCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const categories = await KnowledgeItem.distinct('category');
    res.json({ success: true, data: (categories as string[]).sort() });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

export const toggleUpvote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await KnowledgeItem.findById(req.params.id);
    if (!item) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    const has = item.upvotedBy.includes(req.userId!);
    const updated = await KnowledgeItem.findByIdAndUpdate(
      item._id,
      has
        ? { $pull: { upvotedBy: req.userId }, $inc: { upvotes: -1 } }
        : { $addToSet: { upvotedBy: req.userId }, $inc: { upvotes: 1 } },
      { new: true }
    );
    res.json({ success: true, data: { upvotes: updated!.upvotes, hasUpvoted: !has } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to upvote' });
  }
};

export const recordView = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const item = await KnowledgeItem.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
    if (!item) { res.status(404).json({ success: false, message: 'Item not found' }); return; }
    res.json({ success: true, data: { views: item.views } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to record view' });
  }
};
