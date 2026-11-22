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
  confidenceBreakdown?: { model: number; grounding: number | null; final: number };
  // Knowledge Vault entries retrieved for the AI (RAG); used = the model cited it.
  retrievedSources?: { id: string; title: string; courseCode: string; match: number; used: boolean; author?: string; doubtId?: string }[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  // Mentor workflow: who accepted the routed/escalated doubt and when (response time for reputation).
  acceptedBy?: { userId: string; mentorId: string; name: string };
  acceptedAt?: Date;
  resolvedAt?: Date;
  declinedBy: string[]; // mentor user ids who declined; routing skips them
  rating?: { target: 'mentor' | 'ai'; clarity: number; helpfulness: number; responseTime: number; comment?: string };
  // Confidence gate outcome and the mentors considered (see services/routingService.ts).
  routing?: {
    mode: 'grounded_answer' | 'mentor_routing';
    reason: 'confident' | 'low_confidence' | 'ai_unavailable';
    threshold: number;
    candidates: { mentorId: string; userId: string; name: string; avatar: string; karma: number; online: boolean; relevance: number; reputation: number; score: number }[];
    routedAt?: Date;
  };
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
  answers: { authorId: string; authorName: string; authorAvatar: string; role: string; content: string; createdAt: Date }[];
  upvotedBy: string[];
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
    confidenceBreakdown: { type: Schema.Types.Mixed },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    acceptedBy: { type: Schema.Types.Mixed },
    acceptedAt: { type: Date },
    resolvedAt: { type: Date },
    declinedBy: { type: [String], default: [] },
    rating: { type: Schema.Types.Mixed },
    routing: { type: Schema.Types.Mixed },
    retrievedSources: {
      type: [{ _id: false, id: String, title: String, courseCode: String, match: Number, used: Boolean, author: String, doubtId: String }],
      default: undefined,
    },
    aiSolution: { type: Schema.Types.Mixed },
    assignedMentor: { type: Schema.Types.Mixed },
    answers: {
      type: [
        {
          authorId: String,
          authorName: String,
          authorAvatar: { type: String, default: '' },
          role: String,
          content: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    upvotedBy: { type: [String], default: [] },
    upvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Doubt = mongoose.models.Doubt || mongoose.model<IDoubt>('Doubt', DoubtSchema);
