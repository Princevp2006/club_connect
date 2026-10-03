// ─── Event Tests ─────────────────────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, createTestEvent, cleanAll } = require('./helpers');

let adminToken, leaderToken, studentToken;
let adminUser, leaderUser, studentUser;

beforeAll(async () => {
  await cleanAll();

  adminUser = await createTestUser({ email: 'ev-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  leaderUser = await createTestUser({ email: 'ev-leader@test.local', password: 'Leader@1234', role: 'STUDENT_LEADER' });
  studentUser = await createTestUser({ email: 'ev-student@test.local', password: 'Student@1234', role: 'STUDENT' });

  adminToken = await loginAndGetToken('ev-admin@test.local', 'Admin@1234');
  leaderToken = await loginAndGetToken('ev-leader@test.local', 'Leader@1234');
  studentToken = await loginAndGetToken('ev-student@test.local', 'Student@1234');
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const futureEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString();

const validEvent = {
  title: 'Annual Fest',
  description: 'The annual student festival with many activities.',
  eventDate: futureDate,
  startTime: futureDate,
  endTime: futureEnd,
  location: 'Main Auditorium',
  needsVolunteers: false,
};

describe('POST /api/v1/events', () => {
  it('ADMIN can create an event', async () => {
    const res = await request
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validEvent);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Annual Fest');
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('STUDENT_LEADER can create an event', async () => {
    const res = await request
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ ...validEvent, title: 'Leader Event' });

    expect(res.status).toBe(201);
  });

  it('STUDENT cannot create an event', async () => {
    const res = await request
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(validEvent);

    expect(res.status).toBe(403);
  });

  it('validates needsVolunteers/volunteerLimit consistency', async () => {
    const res = await request
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEvent, needsVolunteers: true }); // missing volunteerLimit

    expect(res.status).toBe(400);
  });

  it('creates event with volunteer slots', async () => {
    const res = await request
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...validEvent, title: 'Vol Event', needsVolunteers: true, volunteerLimit: 5 });

    expect(res.status).toBe(201);
    expect(res.body.data.needsVolunteers).toBe(true);
    expect(res.body.data.volunteerLimit).toBe(5);
  });
});

describe('GET /api/v1/events', () => {
  it('returns paginated events', async () => {
    const res = await request
      .get('/api/v1/events')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toBeInstanceOf(Array);
    expect(res.body.data.meta).toHaveProperty('total');
  });
});

describe('PATCH /api/v1/events/:eventId', () => {
  let eventId;

  beforeAll(async () => {
    const ev = await createTestEvent({ createdById: adminUser.id, needsVolunteers: true, volunteerLimit: 10 });
    eventId = ev.id;
  });

  it('ADMIN can update an event', async () => {
    const res = await request
      .patch(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('can lower volunteerLimit (preserves existing approved volunteers)', async () => {
    const res = await request
      .patch(`/api/v1/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ volunteerLimit: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.volunteerLimit).toBe(3);
  });
});

describe('DELETE /api/v1/events/:eventId', () => {
  it('can delete a DRAFT event', async () => {
    const ev = await createTestEvent({ createdById: adminUser.id, status: 'DRAFT' });
    const res = await request
      .delete(`/api/v1/events/${ev.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('cannot delete a PUBLISHED event', async () => {
    const ev = await createTestEvent({ createdById: adminUser.id, status: 'PUBLISHED' });
    const res = await request
      .delete(`/api/v1/events/${ev.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});
