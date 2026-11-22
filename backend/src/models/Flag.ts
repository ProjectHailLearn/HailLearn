import mongoose, { Schema, Document } from 'mongoose';

// A report of problematic content, reviewed by admins (FR-6.1). Created by users or automatically
// (an AI answer rated unhelpful).
export interface IFlag extends Document {
  targetType: 'doubt' | 'answer' | 'message' | 'knowledge';
  targetId: string; // doubt id, answer subdocument id, message id, or knowledge item id
  parentId?: string; // the doubt an answer belongs to / the request a message belongs to
  reason: string;
  preview: string; // snapshot of the flagged text, kept even if the content is later removed
  reporterId?: string; // absent for automatic flags
  automatic: boolean;
  status: 'open' | 'dismissed' | 'removed';
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

const FlagSchema = new Schema<IFlag>(
  {
    targetType: { type: String, enum: ['doubt', 'answer', 'message', 'knowledge'], required: true },
    targetId: { type: String, required: true },
    parentId: { type: String },
    reason: { type: String, required: true, maxlength: 500 },
    preview: { type: String, default: '' },
    reporterId: { type: String },
    automatic: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'dismissed', 'removed'], default: 'open', index: true },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Flag = mongoose.models.Flag || mongoose.model<IFlag>('Flag', FlagSchema);
