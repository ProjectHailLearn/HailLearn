import mongoose, { Schema, Document } from 'mongoose';

// A student's rating of how their doubt was resolved (FR-5.1). One per doubt.
export interface IRating extends Document {
  doubtId: string;
  studentId: string;
  target: 'mentor' | 'ai'; // who resolved it: a mentor's answer, or the AI answer alone
  mentorUserId?: string;
  mentorId?: string;
  clarity: number; // 1-5
  helpfulness: number; // 1-5
  responseTime: number; // 1-5, the student's view of the speed
  responseMinutes?: number; // measured: doubt posted -> mentor accepted (or first answered)
  comment?: string;
  citedSourceIds: string[]; // vault entries the AI answer cited (for quality-weight feedback)
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    doubtId: { type: String, required: true, unique: true },
    studentId: { type: String, required: true },
    target: { type: String, enum: ['mentor', 'ai'], required: true },
    mentorUserId: { type: String, index: true },
    mentorId: { type: String, index: true },
    clarity: { type: Number, min: 1, max: 5, required: true },
    helpfulness: { type: Number, min: 1, max: 5, required: true },
    responseTime: { type: Number, min: 1, max: 5, required: true },
    responseMinutes: { type: Number },
    comment: { type: String, maxlength: 1000 },
    citedSourceIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Rating = mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema);
