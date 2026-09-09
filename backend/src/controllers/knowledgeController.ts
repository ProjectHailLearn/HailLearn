import { Request, Response } from 'express';
import { KnowledgeItem } from '../models/KnowledgeItem.js';

export const getKnowledgeItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category } = req.query;
    const query: Record<string, unknown> = {};

    if (category && category !== 'ALL') query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { snippet: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await KnowledgeItem.find(query).sort({ upvotes: -1 });
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch knowledge items' });
  }
};
