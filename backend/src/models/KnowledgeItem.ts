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
  similarityScore?: number;
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
    similarityScore: { type: Number },
  },
  { timestamps: true }
);

export const KnowledgeItem = mongoose.model<IKnowledgeItem>('KnowledgeItem', KnowledgeItemSchema);
