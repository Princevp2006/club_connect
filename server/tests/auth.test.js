// ─── Authentication Tests ────────────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, cleanUsers } = require('./helpers');

beforeAll(async () => {
  await cleanUsers();
});

afterAll(async () => {
  await cleanUsers();
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/register', () => {
  afterEach(async () => {
    await cleanUsers();
  });

  it('should register a new student successfully', async () => {
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Jane Doe',
        email: 'jane@example.local',
        password: 'Secure@123',
        studentId: 'STU-JANE-001',
        phone: '+1-555-0100',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe('jane@example.local');
    expect(res.body.data.role).toBe('STUDENT');
    // passwordHash must NEVER be returned
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('should always assign STUDENT role regardless of input', async () => {
    const res = await request
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Hack Admin',
        email: 'hack@example.local',
        password: 'Secure@123',
        studentId: 'STU-HACK-001',
        role: 'ADMIN', // should be ignored
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('STUDENT');
  });

  it('should reject duplicate email', async () => {
    await createTestUser({ email: 'dup@example.local', password: 'Test@1234' });

    const res = await request
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Dup User',
        email: 'dup@example.local',
        password: 'Secure@123',
        studentId: 'STU-DUP-001',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/email/i);
  });

  it('should reject duplicate studentId', async () => {
    await createTestUser({
      email: 'first@example.local',
      studentId: 'STU-DUP-ID',
      password: 'Test@1234',
    });

    const res = await request
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Second User',
        email: 'second@example.local',
        password: 'Secure@123',
        studentId: 'STU-DUP-ID',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/student id/i);
  });

  it('should reject invalid input (missing fields)', async () => {
    const res = await request
      .post('/api/v1/auth/register')
      .send({ fullName: 'No Email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/auth/login', () => {
  const loginEmail = 'logintest@example.local';
  const loginPassword = 'Login@1234';

  beforeAll(async () => {
    await cleanUsers();
    await createTestUser({
      email: loginEmail,
      password: loginPassword,
      role: 'STUDENT',
    });
  });

  afterAll(async () => {
    await cleanUsers();
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: loginEmail, password: loginPassword });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toHaveProperty('id');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('should reject wrong password', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: loginEmail, password: 'WrongPassword' });

    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: 'noone@example.local', password: 'whatever' });

    expect(res.status).toBe(401);
  });

  it('should reject inactive user login', async () => {
    await cleanUsers();
    await createTestUser({
      email: 'inactive@example.local',
      password: 'Inactive@123',
      isActive: false,
    });

    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: 'inactive@example.local', password: 'Inactive@123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/deactivated/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// /auth/me (JWT AUTHENTICATION)
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/auth/me', () => {
  let token;

  beforeAll(async () => {
    await cleanUsers();
    await createTestUser({
      email: 'me@example.local',
      password: 'Me@123456',
      role: 'STUDENT',
    });
    token = await loginAndGetToken('me@example.local', 'Me@123456');
  });

  afterAll(async () => {
    await cleanUsers();
  });

  it('should return current user with valid token', async () => {
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@example.local');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('should reject request without token', async () => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-here');
    expect(res.status).toBe(401);
  });
});
