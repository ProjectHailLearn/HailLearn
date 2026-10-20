import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  requestId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    requestId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true, maxlength: 4000 },
  },
  { timestamps: true }
);

export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
