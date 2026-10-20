import { registerSchema, createDoubtSchema, createRoomSchema, updateProfileSchema } from '../validators/index.js';

describe('validators', () => {
  it('normalizes a valid registration', () => {
    const r = registerSchema.parse({ name: '  Asha  ', email: 'ASHA@Uni.edu', password: 'secret1', semester: '3' });
    expect(r).toMatchObject({ name: 'Asha', email: 'asha@uni.edu', semester: 3 });
  });

  it('rejects admin self-registration and weak passwords', () => {
    expect(registerSchema.safeParse({ name: 'Eve', email: 'e@x.io', password: 'secret1', role: 'admin' }).success).toBe(false);
    expect(registerSchema.safeParse({ name: 'Eve', email: 'e@x.io', password: '123' }).success).toBe(false);
  });

  it('validates doubt depth and minimum lengths', () => {
    const base = { title: 'Explain B-trees', description: 'How do splits work?', subject: 'DB', courseCode: 'CS245' };
    expect(createDoubtSchema.safeParse({ ...base, depth: 'concise' }).success).toBe(true);
    expect(createDoubtSchema.safeParse({ ...base, depth: 'verbose' }).success).toBe(false);
    expect(createDoubtSchema.safeParse({ ...base, title: 'hi' }).success).toBe(false);
  });

  it('coerces room dates and accepts an empty meeting link', () => {
    const r = createRoomSchema.parse({ title: 'DP jam', courseCode: 'CS201', scheduledAt: '2026-10-21T10:00:00Z', meetingLink: '' });
    expect(r.scheduledAt).toBeInstanceOf(Date);
    expect(createRoomSchema.safeParse({ title: 'DP jam', courseCode: 'CS201', scheduledAt: 'x' }).success).toBe(false);
  });

  it('rejects out-of-range semesters on profile update', () => {
    expect(updateProfileSchema.safeParse({ semester: 9 }).success).toBe(false);
  });
});
