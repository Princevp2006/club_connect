// ─── Announcement Tests ──────────────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, cleanAll } = require('./helpers');

let adminToken, leaderToken, studentToken;
let adminUser;
let announcementId;

beforeAll(async () => {
  await cleanAll();

  adminUser = await createTestUser({ email: 'ann-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  await createTestUser({ email: 'ann-leader@test.local', password: 'Leader@1234', role: 'STUDENT_LEADER' });
  await createTestUser({ email: 'ann-student@test.local', password: 'Student@1234', role: 'STUDENT' });

  adminToken = await loginAndGetToken('ann-admin@test.local', 'Admin@1234');
  leaderToken = await loginAndGetToken('ann-leader@test.local', 'Leader@1234');
  studentToken = await loginAndGetToken('ann-student@test.local', 'Student@1234');
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

describe('POST /api/v1/announcements', () => {
  it('ADMIN can create an announcement', async () => {
    const res = await request
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Welcome Back', content: 'Welcome to the new semester!', isPublished: true });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Welcome Back');
    expect(res.body.data.isPublished).toBe(true);
    expect(res.body.data.publishedAt).toBeTruthy();
    announcementId = res.body.data.id;
  });

  it('STUDENT_LEADER can create an announcement', async () => {
    const res = await request
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ title: 'Event Tomorrow', content: 'Don\'t forget the event tomorrow!' });

    expect(res.status).toBe(201);
    expect(res.body.data.isPublished).toBe(false);
  });

  it('STUDENT cannot create an announcement', async () => {
    const res = await request
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Hack', content: 'Should not work' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/announcements', () => {
  it('student sees only published announcements', async () => {
    const res = await request
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const allPublished = res.body.data.data.every((a) => a.isPublished === true);
    expect(allPublished).toBe(true);
  });

  it('ADMIN sees all announcements including unpublished', async () => {
    const res = await request
      .get('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const hasUnpublished = res.body.data.data.some((a) => a.isPublished === false);
    expect(hasUnpublished).toBe(true);
  });
});

describe('PATCH /api/v1/announcements/:id', () => {
  it('ADMIN can update an announcement', async () => {
    const res = await request
      .patch(`/api/v1/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Welcome' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Welcome');
  });
});

describe('DELETE /api/v1/announcements/:id', () => {
  it('STUDENT_LEADER cannot delete an announcement', async () => {
    const res = await request
      .delete(`/api/v1/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.status).toBe(403);
  });

  it('ADMIN can delete an announcement', async () => {
    const res = await request
      .delete(`/api/v1/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
