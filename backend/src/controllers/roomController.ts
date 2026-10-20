import { Response } from 'express';
import { StudyRoom, IStudyRoom } from '../models/StudyRoom.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middlewares/auth.js';
import { emitToAll } from '../socket/index.js';

const toRoom = (r: IStudyRoom, userId?: string) => {
  const start = r.scheduledAt.getTime();
  const end = start + r.durationMins * 60000;
  const now = Date.now();
  return {
    id: r._id,
    title: r.title,
    courseCode: r.courseCode,
    hostId: r.hostId,
    hostName: r.hostName,
    scheduledAt: r.scheduledAt,
    durationMins: r.durationMins,
    meetingLink: r.meetingLink,
    attendees: r.attendeeIds.length,
    isAttending: !!userId && r.attendeeIds.includes(userId),
    isHost: !!userId && r.hostId === userId,
    status: now >= start && now < end ? 'LIVE' : now < start ? 'UPCOMING' : 'ENDED',
  };
};

export const getRooms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only rooms that haven't ended (assumes max duration of 8h for the coarse DB filter).
    const rooms = await StudyRoom.find({ scheduledAt: { $gte: new Date(Date.now() - 8 * 3600000) } })
      .sort({ scheduledAt: 1 })
      .limit(50);
    res.json({
      success: true,
      data: rooms.map((r) => toRoom(r, req.userId)).filter((r) => r.status !== 'ENDED'),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch study rooms' });
  }
};

export const createRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    const { title, courseCode, scheduledAt, durationMins, meetingLink } = req.body;
    const room = await StudyRoom.create({
      title,
      courseCode,
      scheduledAt,
      durationMins: durationMins || 60,
      meetingLink: meetingLink || undefined,
      hostId: user._id.toString(),
      hostName: user.name,
      attendeeIds: [user._id.toString()],
    });
    emitToAll('rooms:changed', { id: room._id });
    res.status(201).json({ success: true, data: toRoom(room, req.userId) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create study room', error: (err as Error).message });
  }
};

export const toggleJoin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const room = await StudyRoom.findById(req.params.id);
    if (!room) { res.status(404).json({ success: false, message: 'Study room not found' }); return; }
    const attending = room.attendeeIds.includes(req.userId!);
    const updated = await StudyRoom.findByIdAndUpdate(
      room._id,
      attending ? { $pull: { attendeeIds: req.userId } } : { $addToSet: { attendeeIds: req.userId } },
      { new: true }
    );
    emitToAll('rooms:changed', { id: room._id });
    res.json({ success: true, data: toRoom(updated!, req.userId) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update attendance' });
  }
};

export const deleteRoom = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isStaff = req.userRole === 'faculty' || req.userRole === 'admin';
    const room = await StudyRoom.findOneAndDelete(isStaff ? { _id: req.params.id } : { _id: req.params.id, hostId: req.userId });
    if (!room) { res.status(404).json({ success: false, message: 'Study room not found or not yours' }); return; }
    emitToAll('rooms:changed', { id: room._id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete study room' });
  }
};
