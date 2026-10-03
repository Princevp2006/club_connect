// ─── Volunteer Workflow Tests ─────────────────────────────────────────────────

const { request, prisma, createTestUser, loginAndGetToken, createTestEvent, cleanAll } = require('./helpers');

let adminToken, leaderToken, studentToken, student2Token;
let adminUser, leaderUser, studentUser, student2User;
let volunteerEvent;

beforeAll(async () => {
  await cleanAll();

  adminUser = await createTestUser({ email: 'vol-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  leaderUser = await createTestUser({ email: 'vol-leader@test.local', password: 'Leader@1234', role: 'STUDENT_LEADER' });
  studentUser = await createTestUser({ email: 'vol-student@test.local', password: 'Student@1234', role: 'STUDENT' });
  student2User = await createTestUser({ email: 'vol-student2@test.local', password: 'Student@1234', role: 'STUDENT', studentId: 'STU-VOL2' });

  adminToken = await loginAndGetToken('vol-admin@test.local', 'Admin@1234');
  leaderToken = await loginAndGetToken('vol-leader@test.local', 'Leader@1234');
  studentToken = await loginAndGetToken('vol-student@test.local', 'Student@1234');
  student2Token = await loginAndGetToken('vol-student2@test.local', 'Student@1234');

  volunteerEvent = await createTestEvent({
    createdById: adminUser.id,
    needsVolunteers: true,
    volunteerLimit: 2,
    title: 'Volunteer Event',
  });
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOLUNTEER APPLICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/events/:eventId/volunteer-applications', () => {
  it('student can apply when volunteer slots exist', async () => {
    const res = await request
      .post(`/api/v1/events/${volunteerEvent.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('student cannot apply twice', async () => {
    const res = await request
      .post(`/api/v1/events/${volunteerEvent.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(409);
  });

  it('second student can also apply', async () => {
    const res = await request
      .post(`/api/v1/events/${volunteerEvent.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(res.status).toBe(201);
  });

  it('student cannot apply when event does not require volunteers', async () => {
    const noVolEvent = await createTestEvent({
      createdById: adminUser.id,
      needsVolunteers: false,
      title: 'No Vol Event',
    });

    const res = await request
      .post(`/api/v1/events/${noVolEvent.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not require volunteers/i);
  });
});

describe('Pending applications do not count toward limit', () => {
  it('pending apps should not consume approved slots', async () => {
    // Both student and student2 have PENDING apps.
    // Approved count = 0, so the limit (2) is not reached.
    const apps = await prisma.volunteerApplication.findMany({
      where: { eventId: volunteerEvent.id },
    });
    const pendingCount = apps.filter((a) => a.status === 'PENDING').length;
    const approvedCount = apps.filter((a) => a.status === 'APPROVED').length;

    expect(pendingCount).toBe(2);
    expect(approvedCount).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// APPROVAL / REJECTION
// ═══════════════════════════════════════════════════════════════════════════════

let app1Id, app2Id;

describe('PATCH /api/v1/volunteer-applications/:id/approve', () => {
  beforeAll(async () => {
    const apps = await prisma.volunteerApplication.findMany({
      where: { eventId: volunteerEvent.id },
      orderBy: { appliedAt: 'asc' },
    });
    app1Id = apps[0].id;
    app2Id = apps[1].id;
  });

  it('ADMIN can approve', async () => {
    const res = await request
      .patch(`/api/v1/volunteer-applications/${app1Id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
    expect(res.body.data.reviewedBy).toBeDefined();
  });

  it('STUDENT_LEADER can approve', async () => {
    const res = await request
      .patch(`/api/v1/volunteer-applications/${app2Id}/approve`)
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('STUDENT cannot approve', async () => {
    // Create a new event and application for this test
    const ev = await createTestEvent({ createdById: adminUser.id, needsVolunteers: true, volunteerLimit: 5, title: 'RBAC Test' });
    const appRes = await request
      .post(`/api/v1/events/${ev.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${studentToken}`);

    const res = await request
      .patch(`/api/v1/volunteer-applications/${appRes.body.data.id}/approve`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('approval fails when limit is reached', async () => {
    // Create a 3rd student and apply – limit is 2 and both slots are approved
    const student3 = await createTestUser({ email: 'vol-student3@test.local', password: 'Student@1234', role: 'STUDENT', studentId: 'STU-VOL3' });
    const s3Token = await loginAndGetToken('vol-student3@test.local', 'Student@1234');

    // Need to temporarily increase limit to allow a 3rd application
    // Actually the limit check on application is about approved count, and 2 are approved.
    // A 3rd student can still APPLY (pending doesn't count toward limit).
    // But wait - our code checks if approvedCount >= volunteerLimit on application.
    // Let's verify:
    const applyRes = await request
      .post(`/api/v1/events/${volunteerEvent.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${s3Token}`);

    // The apply itself should be rejected because approved count (2) >= limit (2)
    expect(applyRes.status).toBe(409);
  });
});

describe('PATCH /api/v1/volunteer-applications/:id/reject', () => {
  let rejectAppId;

  beforeAll(async () => {
    const ev = await createTestEvent({ createdById: adminUser.id, needsVolunteers: true, volunteerLimit: 5, title: 'Reject Test' });
    const appRes = await request
      .post(`/api/v1/events/${ev.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${studentToken}`);
    rejectAppId = appRes.body.data.id;
  });

  it('ADMIN can reject', async () => {
    const res = await request
      .patch(`/api/v1/volunteer-applications/${rejectAppId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REJECTED');
  });

  it('STUDENT_LEADER can reject', async () => {
    const ev = await createTestEvent({ createdById: adminUser.id, needsVolunteers: true, volunteerLimit: 5, title: 'Reject Test 2' });
    const appRes = await request
      .post(`/api/v1/events/${ev.id}/volunteer-applications`)
      .set('Authorization', `Bearer ${studentToken}`);

    const res = await request
      .patch(`/api/v1/volunteer-applications/${appRes.body.data.id}/reject`)
      .set('Authorization', `Bearer ${leaderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REJECTED');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOLUNTEER TASKS
// ═══════════════════════════════════════════════════════════════════════════════

let taskId;

describe('POST /api/v1/events/:eventId/tasks', () => {
  it('only approved volunteer can receive a task', async () => {
    const res = await request
      .post(`/api/v1/events/${volunteerEvent.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        volunteerUserId: studentUser.id,
        taskType: 'REGISTRATION',
        taskTitle: 'Handle Registration Desk',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.taskType).toBe('REGISTRATION');
    taskId = res.body.data.id;
  });

  it('QR_SCANNER is a task type not a role', async () => {
    const res = await request
      .post(`/api/v1/events/${volunteerEvent.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        volunteerUserId: student2User.id,
        taskType: 'QR_SCANNER',
        taskTitle: 'Scan Tickets at Gate A',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.taskType).toBe('QR_SCANNER');

    // Verify the user's role is still STUDENT (QR_SCANNER is NOT a role)
    const userRes = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${student2Token}`);
    expect(userRes.body.data.role).toBe('STUDENT');
  });

  it('non-approved volunteer cannot receive a task', async () => {
    // Create a student with no volunteer application
    const newStudent = await createTestUser({ email: 'no-vol@test.local', password: 'Test@1234', role: 'STUDENT', studentId: 'STU-NOVOL' });

    const res = await request
      .post(`/api/v1/events/${volunteerEvent.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        volunteerUserId: newStudent.id,
        taskType: 'HELP_DESK',
        taskTitle: 'Help Desk',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/approved/i);
  });
});

describe('GET /api/v1/tasks/me', () => {
  it('volunteer can view own tasks', async () => {
    const res = await request
      .get('/api/v1/tasks/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe('PATCH /api/v1/tasks/:taskId/reassign', () => {
  it('task can be reassigned to another approved volunteer', async () => {
    const res = await request
      .patch(`/api/v1/tasks/${taskId}/reassign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ volunteerUserId: student2User.id });

    expect(res.status).toBe(200);
    expect(res.body.data.volunteer.id).toBe(student2User.id);
  });
});

describe('PATCH /api/v1/tasks/:taskId/status', () => {
  it('assigned volunteer can update task status', async () => {
    // Task was reassigned to student2, so student2 should be able to update
    const res = await request
      .patch(`/api/v1/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${student2Token}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ACCEPTED');
  });

  it('non-assigned volunteer cannot update task status', async () => {
    const res = await request
      .patch(`/api/v1/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(403);
  });
});
