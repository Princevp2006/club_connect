// ─── Ticket Tests ────────────────────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, createTestEvent, cleanAll } = require('./helpers');

let adminToken, studentToken;
let adminUser, studentUser;
let ticketEvent;

beforeAll(async () => {
  await cleanAll();

  adminUser = await createTestUser({ email: 'tkt-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  studentUser = await createTestUser({ email: 'tkt-student@test.local', password: 'Student@1234', role: 'STUDENT' });

  adminToken = await loginAndGetToken('tkt-admin@test.local', 'Admin@1234');
  studentToken = await loginAndGetToken('tkt-student@test.local', 'Student@1234');

  ticketEvent = await createTestEvent({ createdById: adminUser.id, title: 'Ticket Event' });
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

describe('POST /api/v1/events/:eventId/tickets', () => {
  it('ticket registration works', async () => {
    const res = await request
      .post(`/api/v1/events/${ticketEvent.id}/tickets`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('ticketCode');
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.ticketCode).toBeTruthy();
  });

  it('ticket code is unique (cannot register twice)', async () => {
    const res = await request
      .post(`/api/v1/events/${ticketEvent.id}/tickets`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already registered/i);
  });

  it('returns 404 for non-existent event', async () => {
    const res = await request
      .post('/api/v1/events/00000000-0000-0000-0000-000000000000/tickets')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/tickets/me', () => {
  it('returns authenticated user tickets', async () => {
    const res = await request
      .get('/api/v1/tickets/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('ticketCode');
    expect(res.body.data[0].event).toHaveProperty('title');
  });
});

describe('GET /api/v1/events/:eventId/tickets (ADMIN)', () => {
  it('ADMIN can view event tickets', async () => {
    const res = await request
      .get(`/api/v1/events/${ticketEvent.id}/tickets`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('STUDENT cannot view event tickets list', async () => {
    const res = await request
      .get(`/api/v1/events/${ticketEvent.id}/tickets`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});
