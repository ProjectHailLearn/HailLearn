import mongoose, { Schema, Document } from 'mongoose';

export interface IMentor extends Document {
  name: string;
  avatar: string;
  department: string;
  year: string;
  rating: number;
  reviewsCount: number;
  resolvedDoubtsCount: number;
  karmaPoints: number;
  isOnline: boolean;
  specializations: string[];
  bio: string;
  userId?: string;
}

const MentorSchema = new Schema<IMentor>(
  {
    name: { type: String, required: true },
    avatar: { type: String, default: '' },
    department: { type: String, required: true },
    year: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    reviewsCount: { type: Number, default: 0 },
    resolvedDoubtsCount: { type: Number, default: 0 },
    karmaPoints: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    specializations: { type: [String], default: [] },
    bio: { type: String, default: '' },
    userId: { type: String },
  },
  { timestamps: true }
);

export const Mentor = mongoose.model<IMentor>('Mentor', MentorSchema);
