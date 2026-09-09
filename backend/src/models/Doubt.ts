import mongoose, { Schema, Document } from 'mongoose';

export interface IDoubt extends Document {
  title: string;
  description: string;
  codeSnippet?: string;
  subject: string;
  courseCode: string;
  tags: string[];
  status: 'ANALYZING' | 'AI_RESOLVED' | 'MENTOR_ESCALATED' | 'FACULTY_VERIFIED' | 'CLOSED';
  author: {
    id: string;
    name: string;
    avatar: string;
    department: string;
  };
  aiConfidenceScore?: number;
  aiSolution?: {
    summary: string;
    steps: { step: number; title: string; content: string; codeSnippet?: string; language?: string }[];
    citations: string[];
    suggestedReadings: string[];
  };
  assignedMentor?: {
    id: string;
    name: string;
    avatar: string;
    karma: number;
  };
  upvotes: number;
  views: number;
  createdAt: Date;
}

const DoubtSchema = new Schema<IDoubt>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    codeSnippet: { type: String },
    subject: { type: String, required: true },
    courseCode: { type: String, required: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['ANALYZING', 'AI_RESOLVED', 'MENTOR_ESCALATED', 'FACULTY_VERIFIED', 'CLOSED'],
      default: 'ANALYZING',
    },
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String, default: '' },
      department: { type: String, default: '' },
    },
    aiConfidenceScore: { type: Number },
    aiSolution: { type: Schema.Types.Mixed },
    assignedMentor: { type: Schema.Types.Mixed },
    upvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Doubt = mongoose.model<IDoubt>('Doubt', DoubtSchema);
