import mongoose from 'mongoose';

let isConnecting = false;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) return;
  if (isConnecting) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  try {
    isConnecting = true;
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } finally {
    isConnecting = false;
  }
};
