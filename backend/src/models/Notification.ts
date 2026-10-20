import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  type: 'ai' | 'mentor' | 'system' | 'course';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['ai', 'mentor', 'system', 'course'], default: 'system' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
