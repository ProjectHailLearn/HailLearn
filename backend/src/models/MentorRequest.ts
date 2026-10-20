import mongoose, { Schema, Document } from 'mongoose';

export interface IMentorRequest extends Document {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  mentorId: string;
  mentorName: string;
  mentorUserId?: string;
  topic: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: Date;
}

const MentorRequestSchema = new Schema<IMentorRequest>(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentAvatar: { type: String, default: '' },
    mentorId: { type: String, required: true },
    mentorName: { type: String, required: true },
    mentorUserId: { type: String, index: true },
    topic: { type: String, default: '' },
    message: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED'], default: 'PENDING' },
  },
  { timestamps: true }
);

export const MentorRequest = mongoose.model<IMentorRequest>('MentorRequest', MentorRequestSchema);
