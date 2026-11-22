import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'mentor' | 'faculty' | 'admin';
  university: string;
  department: string;
  semester?: number;
  karmaPoints: number;
  avatar: string;
  specializations: string[];
  rating?: number;
  preferences: { aiModel: string; emailNotifications: boolean };
  passwordResetHash?: string;
  passwordResetExpires?: Date;
  // Email verification by 6-digit code (FR-1.1). Accounts created before verification existed were migrated to true.
  emailVerified: boolean;
  emailOtpHash?: string;
  emailOtpExpires?: Date;
  emailOtpAttempts?: number;
  // Hashed refresh tokens, one per signed-in device (rotated on every refresh).
  refreshTokens: { hash: string; expiresAt: Date }[];
  suspended: boolean;
  suspendedReason?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'mentor', 'faculty', 'admin'], default: 'student' },
    university: { type: String, default: 'HailLearn University' },
    department: { type: String, default: 'Computer Science & Engineering' },
    semester: { type: Number, min: 1, max: 8 },
    karmaPoints: { type: Number, default: 0 },
    avatar: { type: String, default: '' },
    specializations: { type: [String], default: [] },
    rating: { type: Number, min: 0, max: 5 },
    preferences: {
      aiModel: { type: String, default: 'gemini-3.5-flash' },
      emailNotifications: { type: Boolean, default: true },
    },
    passwordResetHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerified: { type: Boolean, default: false },
    emailOtpHash: { type: String, select: false },
    emailOtpExpires: { type: Date, select: false },
    emailOtpAttempts: { type: Number, select: false },
    refreshTokens: { type: [{ _id: false, hash: String, expiresAt: Date }], default: [], select: false },
    suspended: { type: Boolean, default: false },
    suspendedReason: { type: String },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
