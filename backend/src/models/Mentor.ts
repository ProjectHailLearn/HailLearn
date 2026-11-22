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
  lastSeenAt?: Date;
  // Reputation (FR-5.2): Bayesian average of rating scores, see services/reputationService.ts.
  reputationScore: number;
  ratingsCount: number;
  avgResponseMinutes?: number;
  verifiedBadge: boolean; // granted by an admin after checking the mentor's credentials
  // Weekly availability for routed doubts (FR-4.2); times are local to `timezone`.
  availability: { acceptingDoubts: boolean; timezone: string; slots: { day: number; start: string; end: string }[] };
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
    // Presence: see services/presenceService.ts
    lastSeenAt: { type: Date },
    reputationScore: { type: Number, default: 4 },
    ratingsCount: { type: Number, default: 0 },
    avgResponseMinutes: { type: Number },
    verifiedBadge: { type: Boolean, default: false },
    availability: {
      acceptingDoubts: { type: Boolean, default: true },
      timezone: { type: String, default: 'Asia/Kolkata' },
      slots: { type: [{ _id: false, day: { type: Number, min: 0, max: 6 }, start: String, end: String }], default: [] },
    },
    specializations: { type: [String], default: [] },
    bio: { type: String, default: '' },
    userId: { type: String },
  },
  { timestamps: true }
);

export const Mentor = mongoose.models.Mentor || mongoose.model<IMentor>('Mentor', MentorSchema);
