import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDB } from './config/database.js';
import { seedDatabase } from './utils/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

const start = async () => {
  await connectDB();
  await seedDatabase();

  const app = createApp();
  const server = http.createServer(app);

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
