import { Request, Response, NextFunction } from 'express';
import { z, ZodTypeAny } from 'zod';

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        success: false,
        message: `${issue.path.join('.') || 'body'}: ${issue.message}`,
      });
      return;
    }
    req.body = result.data;
    next();
  };

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('must be a valid email'),
  password: z.string().min(6, 'must be at least 6 characters').max(128),
  role: z.enum(['student', 'mentor', 'faculty']).optional(),
  university: z.string().trim().max(120).optional(),
  department: z.string().trim().max(120).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('must be a valid email'),
  password: z.string().min(1, 'is required'),
});

export const createDoubtSchema = z.object({
  title: z.string().trim().min(5, 'must be at least 5 characters').max(200),
  description: z.string().trim().min(5, 'must be at least 5 characters').max(5000),
  codeSnippet: z.string().max(10000).optional(),
  subject: z.string().trim().min(2).max(120),
  courseCode: z.string().trim().min(2).max(20),
  tags: z.array(z.string().max(40)).max(10).optional(),
  depth: z.enum(['detailed', 'concise', 'socratic']).optional(),
});

export const answerSchema = z.object({
  content: z.string().trim().min(2, 'is required').max(5000),
});

export const createRoomSchema = z.object({
  title: z.string().trim().min(3, 'must be at least 3 characters').max(140),
  courseCode: z.string().trim().min(2).max(20),
  scheduledAt: z.coerce.date(),
  durationMins: z.coerce.number().int().min(15).max(480).optional(),
  meetingLink: z.string().trim().url('must be a valid URL').optional().or(z.literal('')),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  department: z.string().trim().max(120).optional(),
  university: z.string().trim().max(120).optional(),
  semester: z.coerce.number().int().min(1).max(8).optional(),
  avatar: z.string().trim().max(500).optional(),
  specializations: z.array(z.string().trim().max(40)).max(15).optional(),
  preferences: z
    .object({ aiModel: z.string().max(60).optional(), emailNotifications: z.boolean().optional() })
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('must be a valid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f\d]{64}$/, 'is invalid'),
  password: z.string().min(6, 'must be at least 6 characters').max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'is required'),
  newPassword: z.string().min(6, 'must be at least 6 characters').max(128),
});

export const messageSchema = z.object({
  content: z.string().trim().min(1, 'is required').max(4000),
});

export const updateRoleSchema = z.object({
  role: z.enum(['student', 'mentor', 'faculty', 'admin']),
});

export const linkMentorSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, 'must be a valid user id'),
});

export const courseSchema = z.object({
  code: z.string().trim().min(2).max(20),
  title: z.string().trim().min(3).max(160),
  subject: z.string().trim().min(2).max(120),
  instructor: z.string().trim().min(2).max(120),
  credits: z.coerce.number().int().min(1).max(10).optional(),
  category: z.string().trim().max(80).optional(),
  syllabusCovered: z.coerce.number().int().min(0).max(100).optional(),
  nextLecture: z.string().trim().max(120).optional(),
});
