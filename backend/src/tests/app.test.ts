import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../app.js';

// These routes reject before touching MongoDB, so no database is needed.
describe('HTTP app', () => {
  const app = createApp();
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  it('serves the health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 404 for unknown endpoints', async () => {
    expect((await request(app).get('/api/nope')).status).toBe(404);
  });

  it.each(['/api/doubts', '/api/mentors', '/api/courses', '/api/rooms', '/api/notifications', '/api/stats', '/api/knowledge'])(
    'requires auth for %s',
    async (path) => {
      expect((await request(app).get(path)).status).toBe(401);
    }
  );

  it('rejects invalid tokens', async () => {
    const res = await request(app).get('/api/doubts').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  it('validates registration input', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'bad', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name/);
  });

  it('rejects malformed reset tokens', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({ token: 'abc', password: 'secret12' });
    expect(res.status).toBe(400);
  });

  it('validates login input', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'nope' })).status).toBe(400);
  });

  describe('with a valid token', () => {
    const token = () => jwt.sign({ userId: '6ad73a1339df3b78709785bc', role: 'student' }, 'test-secret');

    it('rejects malformed ids with 400', async () => {
      const res = await request(app).put('/api/doubts/not-an-id/upvote').set('Authorization', `Bearer ${token()}`);
      expect(res.status).toBe(400);
    });

    it('forbids students from answering doubts', async () => {
      const res = await request(app)
        .post('/api/doubts/6ad73a1339df3b78709785bc/answer')
        .set('Authorization', `Bearer ${token()}`)
        .send({ content: 'hi' });
      expect(res.status).toBe(403);
    });

    it('restricts the admin API to admins', async () => {
      const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token()}`);
      expect(res.status).toBe(403);
    });

    it('forbids students from editing courses', async () => {
      const res = await request(app)
        .put('/api/courses/6ad73a1339df3b78709785bc')
        .set('Authorization', `Bearer ${token()}`)
        .send({ syllabusCovered: 50 });
      expect(res.status).toBe(403);
    });

    it('validates chat messages', async () => {
      const res = await request(app)
        .post('/api/requests/6ad73a1339df3b78709785bc/messages')
        .set('Authorization', `Bearer ${token()}`)
        .send({ content: '   ' });
      expect(res.status).toBe(400);
    });

    it('validates doubt creation before hitting the database', async () => {
      const res = await request(app)
        .post('/api/doubts')
        .set('Authorization', `Bearer ${token()}`)
        .send({ title: 'x' });
      expect(res.status).toBe(400);
    });
  });
});
