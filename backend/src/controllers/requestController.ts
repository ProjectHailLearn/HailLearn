import { Response } from 'express';
import { MentorRequest } from '../models/MentorRequest.js';
import { Mentor } from '../models/Mentor.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middlewares/auth.js';
import { notify } from '../services/notificationService.js';

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { mentorId, topic, message } = req.body;
    if (!mentorId || !message?.trim()) {
      res.status(400).json({ success: false, message: 'mentorId and message are required' });
      return;
    }
    if (!/^[a-f\d]{24}$/i.test(String(mentorId))) { res.status(400).json({ success: false, message: 'Invalid mentorId' }); return; }
    const [mentor, student] = await Promise.all([Mentor.findById(mentorId), User.findById(req.userId)]);
    if (!mentor || !student) { res.status(404).json({ success: false, message: 'Mentor not found' }); return; }
    if (mentor.userId === req.userId) {
      res.status(400).json({ success: false, message: 'You cannot request yourself' });
      return;
    }

    const request = await MentorRequest.create({
      studentId: student._id.toString(),
      studentName: student.name,
      studentAvatar: student.avatar,
      mentorId: mentor._id.toString(),
      mentorName: mentor.name,
      mentorUserId: mentor.userId,
      topic: topic || '',
      message: message.trim(),
    });

    await notify(mentor.userId, {
      type: 'mentor',
      title: 'New mentorship request',
      message: `${student.name} wants help${topic ? ` with ${topic}` : ''}.`,
      link: '/mentorship',
    });
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send request', error: (err as Error).message });
  }
};

export const getRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [sent, received] = await Promise.all([
      MentorRequest.find({ studentId: req.userId }).sort({ createdAt: -1 }).limit(50),
      MentorRequest.find({ mentorUserId: req.userId }).sort({ createdAt: -1 }).limit(50),
    ]);
    res.json({ success: true, data: { sent, received } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
};

export const respondToRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (status !== 'ACCEPTED' && status !== 'DECLINED') {
      res.status(400).json({ success: false, message: 'status must be ACCEPTED or DECLINED' });
      return;
    }
    const request = await MentorRequest.findOneAndUpdate(
      { _id: req.params.id, mentorUserId: req.userId, status: 'PENDING' },
      { status },
      { new: true }
    );
    if (!request) { res.status(404).json({ success: false, message: 'Pending request not found' }); return; }

    await notify(request.studentId, {
      type: 'mentor',
      title: status === 'ACCEPTED' ? 'Mentor accepted your request' : 'Mentor declined your request',
      message: `${request.mentorName} ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your request${request.topic ? ` on ${request.topic}` : ''}.`,
      link: '/mentorship',
    });
    res.json({ success: true, data: request });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
};
