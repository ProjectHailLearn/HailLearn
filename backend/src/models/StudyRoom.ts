import mongoose, { Schema, Document } from 'mongoose';

export interface IStudyRoom extends Document {
  title: string;
  courseCode: string;
  hostId: string;
  hostName: string;
  scheduledAt: Date;
  durationMins: number;
  attendeeIds: string[];
  meetingLink?: string;
}

const StudyRoomSchema = new Schema<IStudyRoom>(
  {
    title: { type: String, required: true, trim: true },
    courseCode: { type: String, required: true },
    hostId: { type: String, required: true },
    hostName: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMins: { type: Number, default: 60, min: 15, max: 480 },
    attendeeIds: { type: [String], default: [] },
    meetingLink: { type: String },
  },
  { timestamps: true }
);

export const StudyRoom = mongoose.model<IStudyRoom>('StudyRoom', StudyRoomSchema);
