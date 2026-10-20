import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDB } from './config/database.js';
import { seedDatabase } from './utils/seed.js';
import { initSocket } from './socket/index.js';
import { User } from './models/User.js';
import { Mentor } from './models/Mentor.js';

// Comma-separated ADMIN_EMAILS are promoted to admin at startup (and at signup).
const bootstrapAdmins = async (): Promise<void> => {
  const emails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!emails.length) return;
  const res = await User.updateMany({ email: { $in: emails }, role: { $ne: 'admin' } }, { role: 'admin' });
  if (res.modifiedCount) console.log(`Promoted ${res.modifiedCount} admin account(s)`);
};

dotenv.config();

const PORT = process.env.PORT || 5001;

const start = async () => {
  await connectDB();
  await seedDatabase();
  await bootstrapAdmins();
  // Presence is tracked from live socket connections, so nobody is online at boot.
  await Mentor.updateMany({}, { isOnline: false });

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🎓 HailLearn AI OS Backend Server Running`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
