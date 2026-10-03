// ─── QR Scanner & Check-In Tests ─────────────────────────────────────────────
// Tests the critical QR scanner workflow end-to-end.

const {
  request,
  prisma,
  createTestUser,
  loginAndGetToken,
  createTestEvent,
  setupQrScannerWorkflow,
  createTestTicket,
  cleanAll,
} = require('./helpers');

let adminUser, scannerUser, attendeeUser, regularStudent, leaderUser;
let adminToken, scannerToken, attendeeToken, studentToken, leaderToken;
let qrEvent, scannerTask;
let attendeeTicket;

beforeAll(async () => {
  await cleanAll();

  adminUser = await createTestUser({ email: 'qr-admin@test.local', password: 'Admin@1234', role: 'ADMIN', studentId: null });
  scannerUser = await createTestUser({ email: 'qr-scanner@test.local', password: 'Scanner@1234', role: 'STUDENT', studentId: 'STU-SCAN1' });
  attendeeUser = await createTestUser({ email: 'qr-attendee@test.local', password: 'Attend@1234', role: 'STUDENT', studentId: 'STU-ATT1' });
  regularStudent = await createTestUser({ email: 'qr-regular@test.local', password: 'Student@1234', role: 'STUDENT', studentId: 'STU-REG1' });
  leaderUser = await createTestUser({ email: 'qr-leader@test.local', password: 'Leader@1234', role: 'STUDENT_LEADER' });

  adminToken = await loginAndGetToken('qr-admin@test.local', 'Admin@1234');
  scannerToken = await loginAndGetToken('qr-scanner@test.local', 'Scanner@1234');
  attendeeToken = await loginAndGetToken('qr-attendee@test.local', 'Attend@1234');
  studentToken = await loginAndGetToken('qr-regular@test.local', 'Student@1234');
  leaderToken = await loginAndGetToken('qr-leader@test.local', 'Leader@1234');

  // Setup QR scanner workflow for scannerUser
  const workflow = await setupQrScannerWorkflow(adminUser.id, scannerUser.id);
  qrEvent = workflow.event;
  scannerTask = workflow.task;

  // Create a ticket for the attendee on the QR event
  attendeeTicket = await createTestTicket(qrEvent.id, attendeeUser.id);
});

afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCANNER ACCESS
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/events/:eventId/scanner/access', () => {
  it('normal student cannot access scanner', async () => {
    const res = await request
      .get(`/api/v1/events/${qrEvent.id}/scanner/access`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('student leader without QR task cannot access scanner', async () => {
    const res = await request
      .get(`/api/v1/events/${qrEvent.id}/scanner/access`)
      .set('Authorization', `Bearer ${leaderToken}`);
    expect(res.status).toBe(403);
  });

  it('approved volunteer with QR task can access scanner', async () => {
    const res = await request
      .get(`/api/v1/events/${qrEvent.id}/scanner/access`)
      .set('Authorization', `Bearer ${scannerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.allowed).toBe(true);
  });

  it('volunteer with non-QR task cannot access scanner', async () => {
    // Create another volunteer with a REGISTRATION task (not QR_SCANNER)
    const regVolunteer = await createTestUser({ email: 'qr-regvol@test.local', password: 'Vol@1234', role: 'STUDENT', studentId: 'STU-REGVOL' });
    await prisma.volunteerApplication.create({
      data: { eventId: qrEvent.id, userId: regVolunteer.id, status: 'APPROVED', reviewedAt: new Date(), reviewedById: adminUser.id },
    });
    await prisma.volunteerTask.create({
      data: { eventId: qrEvent.id, volunteerUserId: regVolunteer.id, assignedById: adminUser.id, taskType: 'REGISTRATION', taskTitle: 'Reg Desk', status: 'ASSIGNED' },
    });

    const regToken = await loginAndGetToken('qr-regvol@test.local', 'Vol@1234');
    const res = await request
      .get(`/api/v1/events/${qrEvent.id}/scanner/access`)
      .set('Authorization', `Bearer ${regToken}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TICKET SCANNING (CHECK-IN)
// ═══════════════════════════════════════════════════════════════════════════════

describe('POST /api/v1/events/:eventId/checkins', () => {
  it('QR scanner volunteer can scan a valid ticket', async () => {
    const res = await request
      .post(`/api/v1/events/${qrEvent.id}/checkins`)
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ ticketCode: attendeeTicket.ticketCode });

    expect(res.status).toBe(200);
    expect(res.body.data.success).toBe(true);
    expect(res.body.data.attendeeName).toBe(attendeeUser.fullName);
    expect(res.body.data.eventId).toBe(qrEvent.id);
    expect(res.body.data.scannedAt).toBeTruthy();
    expect(res.body.message).toBe('Ticket verified');
  });

  it('creates exactly one check-in record', async () => {
    const checkIns = await prisma.ticketCheckIn.findMany({
      where: { ticketId: attendeeTicket.id },
    });
    expect(checkIns.length).toBe(1);
    expect(checkIns[0].scannedById).toBe(scannerUser.id);
  });

  it('scannedById is the authenticated volunteer (JWT), not frontend-controlled', async () => {
    const checkIn = await prisma.ticketCheckIn.findUnique({
      where: { ticketId: attendeeTicket.id },
    });
    expect(checkIn.scannedById).toBe(scannerUser.id);
  });

  it('duplicate scan is rejected with 409', async () => {
    const res = await request
      .post(`/api/v1/events/${qrEvent.id}/checkins`)
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ ticketCode: attendeeTicket.ticketCode });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already checked in/i);
  });

  it('invalid ticket code is rejected with 404', async () => {
    const res = await request
      .post(`/api/v1/events/${qrEvent.id}/checkins`)
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ ticketCode: 'INVALID-CODE-XYZ' });

    expect(res.status).toBe(404);
  });

  it('cancelled ticket is rejected', async () => {
    const cancelledTicket = await prisma.eventTicket.create({
      data: {
        eventId: qrEvent.id,
        userId: regularStudent.id,
        ticketCode: 'TKT-CANCELLED-TEST',
        status: 'CANCELLED',
      },
    });

    const res = await request
      .post(`/api/v1/events/${qrEvent.id}/checkins`)
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ ticketCode: cancelledTicket.ticketCode });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cancelled/i);
  });

  it('scanner cannot scan ticket from another event', async () => {
    const otherEvent = await createTestEvent({ createdById: adminUser.id, title: 'Other Event' });
    const otherTicket = await createTestTicket(otherEvent.id, attendeeUser.id);

    const res = await request
      .post(`/api/v1/events/${qrEvent.id}/checkins`)
      .set('Authorization', `Bearer ${scannerToken}`)
      .send({ ticketCode: otherTicket.ticketCode });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not belong/i);
  });

  it('normal student cannot scan (no QR task)', async () => {
    const res = await request
      .post(`/api/v1/events/${qrEvent.id}/checkins`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ticketCode: attendeeTicket.ticketCode });

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════

describe('GET /api/v1/events/:eventId/attendance', () => {
  it('ADMIN can view attendance', async () => {
    const res = await request
      .get(`/api/v1/events/${qrEvent.id}/attendance`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('STUDENT cannot view attendance', async () => {
    const res = await request
      .get(`/api/v1/events/${qrEvent.id}/attendance`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/events/:eventId/attendance/count', () => {
  it('returns correct attendance count', async () => {
    const res = await request
      .get(`/api/v1/events/${qrEvent.id}/attendance/count`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.attendanceCount).toBeGreaterThanOrEqual(1);
  });
});
