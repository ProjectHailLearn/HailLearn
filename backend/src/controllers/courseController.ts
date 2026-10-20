import { Response } from 'express';
import { Course } from '../models/Course.js';
import { Doubt } from '../models/Doubt.js';
import { AuthRequest } from '../middlewares/auth.js';

const RESOLVED = ['AI_RESOLVED', 'FACULTY_VERIFIED', 'CLOSED'];

export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [courses, openCounts, myCounts] = await Promise.all([
      Course.find().sort({ code: 1 }),
      Doubt.aggregate<{ _id: string; count: number }>([
        { $match: { status: { $ne: 'CLOSED' } } },
        { $group: { _id: '$courseCode', count: { $sum: 1 } } },
      ]),
      Doubt.aggregate<{ _id: string; total: number; resolved: number }>([
        { $match: { 'author.id': req.userId } },
        {
          $group: {
            _id: '$courseCode',
            total: { $sum: 1 },
            resolved: { $sum: { $cond: [{ $in: ['$status', RESOLVED] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const open = Object.fromEntries(openCounts.map((c) => [c._id, c.count]));
    const mine = Object.fromEntries(myCounts.map((c) => [c._id, c]));

    res.json({
      success: true,
      data: courses.map((c) => {
        const my = mine[c.code];
        return {
          id: c._id,
          code: c.code,
          title: c.title,
          subject: c.subject,
          instructor: c.instructor,
          credits: c.credits,
          category: c.category,
          syllabusCovered: c.syllabusCovered,
          nextLecture: c.nextLecture,
          enrolledStudents: c.baseEnrollment + c.enrolledUserIds.length,
          isEnrolled: c.enrolledUserIds.includes(req.userId!),
          activeDoubts: open[c.code] || 0,
          myDoubts: my?.total || 0,
          myResolved: my?.resolved || 0,
          progress: my?.total ? Math.round((my.resolved / my.total) * 100) : 0,
        };
      }),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

export const toggleEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) { res.status(404).json({ success: false, message: 'Course not found' }); return; }
    const enrolled = course.enrolledUserIds.includes(req.userId!);
    await Course.updateOne(
      { _id: course._id },
      enrolled ? { $pull: { enrolledUserIds: req.userId } } : { $addToSet: { enrolledUserIds: req.userId } }
    );
    res.json({ success: true, data: { isEnrolled: !enrolled } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update enrollment' });
  }
};
