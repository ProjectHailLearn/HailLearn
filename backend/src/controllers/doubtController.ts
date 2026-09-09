import { Response } from 'express';
import { Doubt } from '../models/Doubt.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getDoubts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doubts = await Doubt.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: doubts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch doubts' });
  }
};

export const createDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, codeSnippet, subject, courseCode, tags, aiSolution, aiConfidenceScore } = req.body;

    const doubt = await Doubt.create({
      title,
      description,
      codeSnippet,
      subject,
      courseCode,
      tags: tags || [],
      status: aiSolution ? 'AI_RESOLVED' : 'ANALYZING',
      author: {
        id: req.userId,
        name: req.body.authorName || 'Student',
        avatar: req.body.authorAvatar || '',
        department: req.body.authorDepartment || '',
      },
      aiSolution,
      aiConfidenceScore,
      upvotes: 1,
      views: 1,
    });

    res.status(201).json({ success: true, data: doubt });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create doubt', error: (err as Error).message });
  }
};

export const upvoteDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    res.json({ success: true, data: doubt });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to upvote' });
  }
};

export const escalateDoubt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mentorId, mentorName, mentorAvatar, karma } = req.body;
    const doubt = await Doubt.findByIdAndUpdate(
      req.params.id,
      {
        status: 'MENTOR_ESCALATED',
        assignedMentor: { id: mentorId, name: mentorName, avatar: mentorAvatar, karma },
      },
      { new: true }
    );
    if (!doubt) { res.status(404).json({ success: false, message: 'Doubt not found' }); return; }
    res.json({ success: true, data: doubt });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to escalate doubt' });
  }
};
