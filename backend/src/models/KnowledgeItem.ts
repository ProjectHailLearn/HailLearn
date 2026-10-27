import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeItem extends Document {
  title: string;
  category: string;
  courseCode: string;
  author: string;
  verificationBadge: boolean;
  upvotes: number;
  views: number;
  tags: string[];
  snippet: string;
  // Full answer shown when the item is opened; doubtId links items published from verified doubts.
  content?: string;
  doubtId?: string;
  similarityScore?: number;
  upvotedBy: string[];
}

const KnowledgeItemSchema = new Schema<IKnowledgeItem>(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    courseCode: { type: String, required: true },
    author: { type: String, required: true },
    verificationBadge: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    snippet: { type: String, required: true },
    content: { type: String },
    doubtId: { type: String },
    similarityScore: { type: Number },
    upvotedBy: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const KnowledgeItem = mongoose.models.KnowledgeItem || mongoose.model<IKnowledgeItem>('KnowledgeItem', KnowledgeItemSchema);
