// ─── Development Seed ────────────────────────────────────────────────────────
// Creates test data for local development across Phase 1 + Phase 2 + Phase 3.
// WARNING: These credentials are for DEVELOPMENT ONLY.
// ─────────────────────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const seedUsers = [
  {
    fullName: 'Admin User',
    email: 'admin@example.local',
    password: 'Admin@123',
    role: 'ADMIN',
    studentId: null,
    phone: '+1-000-000-0001',
  },
  {
    fullName: 'Student Leader',
    email: 'leader@example.local',
    password: 'Leader@123',
    role: 'STUDENT_LEADER',
    studentId: 'STU-LEADER-001',
    phone: '+1-000-000-0002',
  },
  {
    fullName: 'Regular Student',
    email: 'student@example.local',
    password: 'Student@123',
    role: 'STUDENT',
    studentId: 'STU-001',
    phone: '+1-000-000-0003',
  },
];

async function main() {
  console.log('🌱 Seeding database …');

  // ── Phase 1: Users ──────────────────────────────────
  const createdUsers = {};
  for (const user of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      console.log(`   ⏭  ${user.email} already exists – skipping.`);
      createdUsers[user.role] = existing;
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);

    const created = await prisma.user.create({
      data: {
        fullName: user.fullName,
        email: user.email,
        passwordHash,
        role: user.role,
        studentId: user.studentId,
        phone: user.phone,
        isActive: true,
      },
    });

    createdUsers[user.role] = created;
    console.log(`   ✅ Created ${user.role}: ${user.email} / ${user.password}`);
  }

  const adminId = createdUsers.ADMIN?.id;
  const studentId = createdUsers.STUDENT?.id;

  // ── Phase 2: Sample Event ───────────────────────────
  if (adminId) {
    const existingEvent = await prisma.event.findFirst({ where: { title: 'Annual Student Fest 2026' } });
    if (!existingEvent) {
      const eventDate = new Date('2026-12-15T10:00:00Z');
      const event = await prisma.event.create({
        data: {
          title: 'Annual Student Fest 2026',
          description: 'The biggest student festival of the year with performances, games, and workshops.',
          eventDate,
          startTime: eventDate,
          endTime: new Date('2026-12-15T18:00:00Z'),
          location: 'Main Campus Auditorium',
          createdById: adminId,
          status: 'PUBLISHED',
          needsVolunteers: true,
          volunteerLimit: 10,
        },
      });
      console.log(`   ✅ Created event: ${event.title}`);

      // Create a sample ticket for the student
      if (studentId) {
        const ticketCode = `TKT-${uuidv4().split('-')[0].toUpperCase()}-SEED`;
        await prisma.eventTicket.create({
          data: {
            eventId: event.id,
            userId: studentId,
            ticketCode,
            status: 'ACTIVE',
          },
        });
        console.log(`   ✅ Created ticket: ${ticketCode}`);
      }
    } else {
      console.log('   ⏭  Sample event already exists – skipping.');
    }

    // Create a sample membership for the student
    if (studentId) {
      const existingMembership = await prisma.membership.findFirst({ where: { userId: studentId } });
      if (!existingMembership) {
        await prisma.membership.create({
          data: {
            userId: studentId,
            membershipType: 'Annual',
            startDate: new Date('2026-01-01T00:00:00Z'),
            endDate: new Date('2026-12-31T23:59:59Z'),
            status: 'ACTIVE',
          },
        });
        console.log('   ✅ Created sample membership for student.');
      }
    }
  }

  // ── Phase 3: Merchandise ────────────────────────────
  const existingMerch = await prisma.merchandise.findFirst({ where: { name: 'Org Logo T-Shirt' } });
  if (!existingMerch) {
    const tshirt = await prisma.merchandise.create({
      data: { name: 'Org Logo T-Shirt', description: 'Classic cotton t-shirt with org logo', size: 'M', stockQuantity: 100, isActive: true },
    });
    const hoodie = await prisma.merchandise.create({
      data: { name: 'Org Hoodie', description: 'Premium hoodie with embroidered logo', size: 'L', stockQuantity: 50, isActive: true },
    });
    const cap = await prisma.merchandise.create({
      data: { name: 'Org Cap', description: 'Snapback cap with org logo', size: null, stockQuantity: 75, isActive: true },
    });
    console.log('   ✅ Created 3 sample merchandise products.');

    // Create a sample order for the student
    if (studentId) {
      await prisma.merchandiseOrder.create({
        data: { userId: studentId, productId: tshirt.id, quantity: 1, status: 'PLACED' },
      });
      console.log('   ✅ Created sample order for student.');
    }
  } else {
    console.log('   ⏭  Sample merchandise already exists – skipping.');
  }

  // ── Phase 3: Announcements ──────────────────────────
  if (adminId) {
    const existingAnn = await prisma.announcement.findFirst({ where: { title: 'Welcome to the New Semester!' } });
    if (!existingAnn) {
      await prisma.announcement.create({
        data: {
          title: 'Welcome to the New Semester!',
          content: 'We are excited to welcome everyone back. Check out our upcoming events and volunteer opportunities!',
          createdById: adminId,
          isPublished: true,
          publishedAt: new Date(),
        },
      });
      await prisma.announcement.create({
        data: {
          title: 'Draft: Upcoming Elections',
          content: 'Student organization elections will be held next month. Details coming soon.',
          createdById: adminId,
          isPublished: false,
        },
      });
      console.log('   ✅ Created 2 sample announcements.');
    }
  }

  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
