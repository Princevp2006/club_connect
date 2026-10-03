// ─── Test Helpers ────────────────────────────────────────────────────────────
const supertest = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');
const bcrypt = require('bcrypt');

const request = supertest(app);

/**
 * Create a user directly in the database (bypasses registration validation).
 */
async function createTestUser(overrides = {}) {
  const data = {
    fullName: overrides.fullName || 'Test User',
    email: overrides.email || `test-${Date.now()}@example.local`,
    passwordHash: await bcrypt.hash(overrides.password || 'Test@1234', 10),
    role: overrides.role || 'STUDENT',
    studentId: overrides.studentId || `STU-${Date.now()}`,
    phone: overrides.phone || null,
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  };

  return prisma.user.create({ data });
}

/**
 * Login and return the JWT token.
 */
async function loginAndGetToken(email, password) {
  const res = await request
    .post('/api/v1/auth/login')
    .send({ email, password });
  return res.body.data?.token;
}

/**
 * Create an event directly in the database.
 */
async function createTestEvent(overrides = {}) {
  const future = new Date();
  future.setDate(future.getDate() + 30);
  const futureEnd = new Date(future);
  futureEnd.setHours(futureEnd.getHours() + 3);

  const data = {
    title: overrides.title || 'Test Event',
    description: overrides.description || 'A test event description',
    eventDate: overrides.eventDate || future,
    startTime: overrides.startTime || future,
    endTime: overrides.endTime || futureEnd,
    location: overrides.location || 'Test Venue',
    createdById: overrides.createdById,
    status: overrides.status || 'PUBLISHED',
    needsVolunteers: overrides.needsVolunteers !== undefined ? overrides.needsVolunteers : false,
    volunteerLimit: overrides.volunteerLimit !== undefined ? overrides.volunteerLimit : null,
  };

  return prisma.event.create({ data });
}

/**
 * Create a merchandise product directly in the database.
 */
async function createTestProduct(overrides = {}) {
  return prisma.merchandise.create({
    data: {
      name: overrides.name || 'Test Product',
      description: overrides.description || 'A test product',
      size: overrides.size || 'M',
      stockQuantity: overrides.stockQuantity !== undefined ? overrides.stockQuantity : 100,
      isActive: overrides.isActive !== undefined ? overrides.isActive : true,
    },
  });
}

/**
 * Setup the full QR scanner workflow:
 * Creates event, volunteer application (APPROVED), and QR_SCANNER task.
 * Returns { event, application, task }.
 */
async function setupQrScannerWorkflow(adminId, scannerId) {
  const event = await createTestEvent({
    createdById: adminId,
    needsVolunteers: true,
    volunteerLimit: 5,
    title: 'QR Test Event',
  });

  const application = await prisma.volunteerApplication.create({
    data: {
      eventId: event.id,
      userId: scannerId,
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedById: adminId,
    },
  });

  const task = await prisma.volunteerTask.create({
    data: {
      eventId: event.id,
      volunteerUserId: scannerId,
      assignedById: adminId,
      taskType: 'QR_SCANNER',
      taskTitle: 'Gate Scanner',
      status: 'ASSIGNED',
    },
  });

  return { event, application, task };
}

/**
 * Create a ticket for a user on an event.
 */
async function createTestTicket(eventId, userId) {
  const { v4: uuidv4 } = require('uuid');
  return prisma.eventTicket.create({
    data: {
      eventId,
      userId,
      ticketCode: `TKT-TEST-${uuidv4().split('-')[0].toUpperCase()}`,
      status: 'ACTIVE',
    },
  });
}

/**
 * Clean all data in FK-safe order.
 */
async function cleanAll() {
  await prisma.ticketCheckIn.deleteMany();
  await prisma.merchandiseOrder.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.volunteerTask.deleteMany();
  await prisma.volunteerApplication.deleteMany();
  await prisma.eventTicket.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.merchandise.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Remove all users from the database.
 */
async function cleanUsers() {
  await cleanAll();
}

module.exports = {
  request,
  prisma,
  createTestUser,
  loginAndGetToken,
  createTestEvent,
  createTestProduct,
  setupQrScannerWorkflow,
  createTestTicket,
  cleanAll,
  cleanUsers,
};
