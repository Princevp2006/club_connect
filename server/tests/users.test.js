// ─── User Management & RBAC Tests ────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, cleanUsers } = require('./helpers');

let adminToken;
let studentToken;
let leaderToken;
let studentUser;
let leaderUser;

beforeAll(async () => {
  await cleanUsers();

  // Create test users for all three roles
  await createTestUser({
    fullName: 'Admin User',
    email: 'admin-test@example.local',
    password: 'Admin@1234',
    role: 'ADMIN',
    studentId: null,
  });

  leaderUser = await createTestUser({
    fullName: 'Leader User',
    email: 'leader-test@example.local',
    password: 'Leader@1234',
    role: 'STUDENT_LEADER',
    studentId: 'STU-L-TEST',
  });

  studentUser = await createTestUser({
    fullName: 'Student User',
    email: 'student-test@example.local',
    password: 'Student@1234',
    role: 'STUDENT',
    studentId: 'STU-S-TEST',
  });

  adminToken = await loginAndGetToken('admin-test@example.local', 'Admin@1234');
  leaderToken = await loginAndGetToken('leader-test@example.local', 'Leader@1234');
  studentToken = await loginAndGetToken('student-test@example.local', 'Student@1234');
});

afterAll(async () => {
  await cleanUsers();
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN – LIST USERS
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/users (ADMIN)', () => {
  it('should list users with pagination', async () => {
    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toBeInstanceOf(Array);
    expect(res.body.data.meta).toHaveProperty('total');
    expect(res.body.data.meta).toHaveProperty('page');
    expect(res.body.data.meta).toHaveProperty('totalPages');
  });

  it('should filter users by role', async () => {
    const res = await request
      .get('/api/v1/users?role=STUDENT')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.data.data.forEach((u) => {
      expect(u.role).toBe('STUDENT');
    });
  });

  it('should search users by name', async () => {
    const res = await request
      .get('/api/v1/users?search=Admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN – GET USER DETAILS
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/users/:userId (ADMIN)', () => {
  it('should return user details', async () => {
    const res = await request
      .get(`/api/v1/users/${studentUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(studentUser.id);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('should return 404 for non-existent user', async () => {
    const res = await request
      .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN – CHANGE ROLE
// ═══════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v1/users/:userId/role (ADMIN)', () => {
  it('should change a user role', async () => {
    const res = await request
      .patch(`/api/v1/users/${studentUser.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STUDENT_LEADER' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('STUDENT_LEADER');

    // Reset role back
    await request
      .patch(`/api/v1/users/${studentUser.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STUDENT' });
  });

  it('should reject invalid role value', async () => {
    const res = await request
      .patch(`/api/v1/users/${studentUser.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'SUPERADMIN' });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN – ACTIVATE / DEACTIVATE
// ═══════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/v1/users/:userId/activate & deactivate (ADMIN)', () => {
  let targetUser;

  beforeAll(async () => {
    targetUser = await createTestUser({
      email: 'toggle@example.local',
      password: 'Toggle@1234',
      role: 'STUDENT',
      studentId: 'STU-TOGGLE',
    });
  });

  it('should deactivate a user', async () => {
    const res = await request
      .patch(`/api/v1/users/${targetUser.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('should reject deactivating an already inactive user', async () => {
    const res = await request
      .patch(`/api/v1/users/${targetUser.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });

  it('should activate a user', async () => {
    const res = await request
      .patch(`/api/v1/users/${targetUser.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(true);
  });

  it('should reject activating an already active user', async () => {
    const res = await request
      .patch(`/api/v1/users/${targetUser.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LAST-ADMIN PROTECTION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Last-admin guard', () => {
  let soloAdmin;

  beforeAll(async () => {
    await cleanUsers();
    soloAdmin = await createTestUser({
      email: 'solo-admin@example.local',
      password: 'Solo@1234',
      role: 'ADMIN',
      studentId: null,
    });
    adminToken = await loginAndGetToken('solo-admin@example.local', 'Solo@1234');
  });

  it('should prevent demoting the last active admin', async () => {
    const res = await request
      .patch(`/api/v1/users/${soloAdmin.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STUDENT' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/last active admin/i);
  });

  it('should prevent deactivating the last active admin', async () => {
    const res = await request
      .patch(`/api/v1/users/${soloAdmin.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/last active admin/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC – STUDENT DENIED ADMIN APIs
// ═══════════════════════════════════════════════════════════════════════════════

describe('RBAC – STUDENT denied admin APIs', () => {
  beforeAll(async () => {
    await cleanUsers();
    await createTestUser({
      email: 'rbac-student@example.local',
      password: 'Rbac@1234',
      role: 'STUDENT',
    });
    studentToken = await loginAndGetToken('rbac-student@example.local', 'Rbac@1234');
  });

  it('should deny STUDENT listing users', async () => {
    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('should deny STUDENT changing roles', async () => {
    const res = await request
      .patch('/api/v1/users/some-id/role')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
  });

  it('should deny STUDENT activating users', async () => {
    const res = await request
      .patch('/api/v1/users/some-id/activate')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('should deny STUDENT deactivating users', async () => {
    const res = await request
      .patch('/api/v1/users/some-id/deactivate')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// RBAC – STUDENT_LEADER DENIED ADMIN-ONLY APIs
// ═══════════════════════════════════════════════════════════════════════════════

describe('RBAC – STUDENT_LEADER denied admin-only APIs', () => {
  beforeAll(async () => {
    await cleanUsers();
    await createTestUser({
      email: 'rbac-leader@example.local',
      password: 'Rbac@1234',
      role: 'STUDENT_LEADER',
    });
    leaderToken = await loginAndGetToken('rbac-leader@example.local', 'Rbac@1234');
  });

  it('should deny STUDENT_LEADER listing users', async () => {
    const res = await request
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.status).toBe(403);
  });

  it('should deny STUDENT_LEADER changing roles', async () => {
    const res = await request
      .patch('/api/v1/users/some-id/role')
      .set('Authorization', `Bearer ${leaderToken}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(403);
  });

  it('should deny STUDENT_LEADER activating users', async () => {
    const res = await request
      .patch('/api/v1/users/some-id/activate')
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.status).toBe(403);
  });

  it('should deny STUDENT_LEADER deactivating users', async () => {
    const res = await request
      .patch('/api/v1/users/some-id/deactivate')
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.status).toBe(403);
  });
});
