// ─── Dashboard Tests ─────────────────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, cleanAll } = require('./helpers');

let adminToken, leaderToken, studentToken;

beforeAll(async () => {
  await cleanAll();

  await createTestUser({ email: 'dash-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  await createTestUser({ email: 'dash-leader@test.local', password: 'Leader@1234', role: 'STUDENT_LEADER' });
  await createTestUser({ email: 'dash-student@test.local', password: 'Student@1234', role: 'STUDENT' });

  adminToken = await loginAndGetToken('dash-admin@test.local', 'Admin@1234');
  leaderToken = await loginAndGetToken('dash-leader@test.local', 'Leader@1234');
  studentToken = await loginAndGetToken('dash-student@test.local', 'Student@1234');
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

describe('GET /api/v1/dashboard/student', () => {
  it('STUDENT sees student dashboard', async () => {
    const res = await request
      .get('/api/v1/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('upcomingEvents');
    expect(res.body.data).toHaveProperty('myTickets');
    expect(res.body.data).toHaveProperty('myApplications');
    expect(res.body.data).toHaveProperty('myTasks');
    expect(res.body.data).toHaveProperty('myOrders');
    expect(res.body.data).toHaveProperty('recentAnnouncements');
  });

  it('ADMIN cannot access student dashboard', async () => {
    const res = await request
      .get('/api/v1/dashboard/student')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/dashboard/student-leader', () => {
  it('STUDENT_LEADER sees operational dashboard', async () => {
    const res = await request
      .get('/api/v1/dashboard/student-leader')
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('upcomingEvents');
    expect(res.body.data).toHaveProperty('pendingApplications');
    expect(res.body.data).toHaveProperty('approvedVolunteerCount');
    expect(res.body.data).toHaveProperty('taskCount');
    expect(res.body.data).toHaveProperty('totalAttendance');
    expect(res.body.data).toHaveProperty('activeQrScanners');
    expect(res.body.data).toHaveProperty('recentAnnouncements');
  });

  it('STUDENT cannot access leader dashboard', async () => {
    const res = await request
      .get('/api/v1/dashboard/student-leader')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/dashboard/admin', () => {
  it('ADMIN sees system-level dashboard', async () => {
    const res = await request
      .get('/api/v1/dashboard/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalUsers');
    expect(res.body.data).toHaveProperty('studentCount');
    expect(res.body.data).toHaveProperty('leaderCount');
    expect(res.body.data).toHaveProperty('upcomingEvents');
    expect(res.body.data).toHaveProperty('volunteerApplications');
    expect(res.body.data).toHaveProperty('approvedVolunteers');
    expect(res.body.data).toHaveProperty('totalAttendance');
    expect(res.body.data).toHaveProperty('merchandiseTotalStock');
    expect(res.body.data).toHaveProperty('orderCount');
    expect(res.body.data).toHaveProperty('announcementCount');
  });

  it('STUDENT_LEADER cannot access admin dashboard', async () => {
    const res = await request
      .get('/api/v1/dashboard/admin')
      .set('Authorization', `Bearer ${leaderToken}`);
    expect(res.status).toBe(403);
  });
});
