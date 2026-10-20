import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  code: string;
  title: string;
  subject: string;
  instructor: string;
  credits: number;
  category: string;
  syllabusCovered: number;
  nextLecture: string;
  enrolledUserIds: string[];
  baseEnrollment: number;
}

const CourseSchema = new Schema<ICourse>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    instructor: { type: String, required: true },
    credits: { type: Number, default: 3 },
    category: { type: String, default: 'Computer Science' },
    syllabusCovered: { type: Number, default: 0, min: 0, max: 100 },
    nextLecture: { type: String, default: 'TBA' },
    enrolledUserIds: { type: [String], default: [] },
    // Students enrolled outside HailLearn (registrar count).
    baseEnrollment: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
