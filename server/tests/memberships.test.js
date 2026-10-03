// ─── Membership Tests ────────────────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, cleanAll } = require('./helpers');

let adminToken, studentToken;
let adminUser, studentUser;

beforeAll(async () => {
  await cleanAll();

  adminUser = await createTestUser({ email: 'mem-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  studentUser = await createTestUser({ email: 'mem-student@test.local', password: 'Student@1234', role: 'STUDENT' });

  adminToken = await loginAndGetToken('mem-admin@test.local', 'Admin@1234');
  studentToken = await loginAndGetToken('mem-student@test.local', 'Student@1234');
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

let membershipId;

describe('POST /api/v1/memberships', () => {
  it('ADMIN can create a membership', async () => {
    const res = await request
      .post('/api/v1/memberships')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: studentUser.id,
        membershipType: 'Annual',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.membershipType).toBe('Annual');
    expect(res.body.data.status).toBe('ACTIVE');
    membershipId = res.body.data.id;
  });

  it('STUDENT cannot create a membership', async () => {
    const res = await request
      .post('/api/v1/memberships')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        userId: studentUser.id,
        membershipType: 'Monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/memberships/me', () => {
  it('student can view own memberships', async () => {
    const res = await request
      .get('/api/v1/memberships/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('GET /api/v1/memberships (ADMIN)', () => {
  it('ADMIN can list all memberships', async () => {
    const res = await request
      .get('/api/v1/memberships')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toBeInstanceOf(Array);
    expect(res.body.data.meta).toHaveProperty('total');
  });

  it('STUDENT cannot list all memberships', async () => {
    const res = await request
      .get('/api/v1/memberships')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/v1/memberships/:membershipId', () => {
  it('ADMIN can update a membership', async () => {
    const res = await request
      .patch(`/api/v1/memberships/${membershipId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'EXPIRED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('EXPIRED');
  });
});
