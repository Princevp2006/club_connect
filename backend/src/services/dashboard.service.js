// ─── Dashboard Service ───────────────────────────────────────────────────────
const prisma = require('../lib/prisma');
const { syncEventStatuses } = require('./event.service');

/**
 * Student dashboard data.
 */
async function getStudentDashboard(userId) {
  await syncEventStatuses();
  const now = new Date();

  const [upcomingEvents, tickets, volunteerApplications, tasks, orders, announcements, membership] = await Promise.all([
    prisma.event.findMany({
      where: { eventDate: { gte: now }, status: { in: ['PUBLISHED', 'ONGOING'] } },
      orderBy: { eventDate: 'asc' },
      take: 5,
      select: { id: true, title: true, eventDate: true, startTime: true, location: true, status: true },
    }),
    prisma.eventTicket.findMany({
      where: { userId },
      include: { event: { select: { id: true, title: true, eventDate: true } } },
      orderBy: { registeredAt: 'desc' },
      take: 5,
    }),
    prisma.volunteerApplication.findMany({
      where: { userId },
      include: { event: { select: { id: true, title: true } } },
      orderBy: { appliedAt: 'desc' },
      take: 5,
    }),
    prisma.volunteerTask.findMany({
      where: { volunteerUserId: userId },
      include: { event: { select: { id: true, title: true } } },
      orderBy: { assignedAt: 'desc' },
      take: 5,
    }),
    prisma.merchandiseOrder.findMany({
      where: { userId },
      include: { product: { select: { id: true, name: true } } },
      orderBy: { orderedAt: 'desc' },
      take: 5,
    }),
    prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, content: true, publishedAt: true, createdAt: true },
    }),
    prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    upcomingEvents,
    tickets,
    myTickets: tickets,
    volunteerApplications,
    myApplications: volunteerApplications,
    tasks,
    myTasks: tasks,
    orders,
    myOrders: orders,
    recentAnnouncements: announcements,
    membership,
  };
}

/**
 * Student leader dashboard data.
 */
async function getLeaderDashboard() {
  await syncEventStatuses();
  const now = new Date();

  const [
    upcomingEvents,
    pendingVolunteerApplications,
    approvedVolunteers,
    volunteerTasks,
    attendanceCount,
    activeQrScanners,
    announcements,
  ] = await Promise.all([
    prisma.event.findMany({
      where: { eventDate: { gte: now }, status: { in: ['PUBLISHED', 'ONGOING'] } },
      orderBy: { eventDate: 'asc' },
      take: 10,
      select: { id: true, title: true, eventDate: true, startTime: true, location: true, status: true },
    }),
    prisma.volunteerApplication.count({ where: { status: 'PENDING' } }),
    prisma.volunteerApplication.count({ where: { status: 'APPROVED' } }),
    prisma.volunteerTask.count(),
    prisma.ticketCheckIn.count(),
    prisma.volunteerTask.count({
      where: { taskType: 'QR_SCANNER', status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] } },
    }),
    prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, content: true, publishedAt: true, createdAt: true },
    }),
  ]);

  return {
    upcomingEvents,
    pendingVolunteerApplications,
    pendingApplications: pendingVolunteerApplications,
    approvedVolunteers,
    approvedVolunteerCount: approvedVolunteers,
    volunteerTasks,
    taskCount: volunteerTasks,
    attendanceCount,
    totalAttendance: attendanceCount,
    activeQrScanners,
    recentAnnouncements: announcements,
  };
}

/**
 * Admin dashboard data.
 */
async function getAdminDashboard() {
  await syncEventStatuses();
  const now = new Date();

  const [
    totalUsers,
    students,
    studentLeaders,
    admins,
    inactiveUsers,
    upcomingEventsCount,
    upcomingEventsList,
    volunteerApplications,
    approvedVolunteers,
    attendance,
    merchandiseStock,
    orders,
    announcements,
    volunteerStatusGroups,
    attendanceByEvent,
    merchandiseProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT_LEADER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.event.count({ where: { eventDate: { gte: now }, status: { in: ['PUBLISHED', 'ONGOING'] } } }),
    prisma.event.findMany({
      where: { eventDate: { gte: now }, status: { in: ['PUBLISHED', 'ONGOING'] } },
      orderBy: { eventDate: 'asc' },
      take: 10,
      select: { id: true, title: true, eventDate: true, startTime: true, location: true, status: true },
    }),
    prisma.volunteerApplication.count(),
    prisma.volunteerApplication.count({ where: { status: 'APPROVED' } }),
    prisma.ticketCheckIn.count(),
    prisma.merchandise.aggregate({ _sum: { stockQuantity: true } }),
    prisma.merchandiseOrder.count(),
    prisma.announcement.count(),
    // Volunteer overview: group by status
    prisma.volunteerApplication.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    // Attendance overview: per-event check-in counts
    prisma.ticketCheckIn.groupBy({
      by: ['eventId'],
      _count: { id: true },
    }),
    // Merchandise overview: name + stock per product
    prisma.merchandise.findMany({
      where: { isActive: true },
      select: { id: true, name: true, stockQuantity: true },
      orderBy: { stockQuantity: 'desc' },
      take: 10,
    }),
  ]);

  // Build volunteer overview array for the frontend bar chart
  const volunteerOverview = volunteerStatusGroups.map((g) => ({
    status: g.status,
    count: g._count.status,
  }));

  // Build attendance overview: need event titles
  let attendanceOverview = [];
  if (attendanceByEvent.length > 0) {
    const eventIds = attendanceByEvent.map((a) => a.eventId);
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, title: true },
    });
    const eventMap = Object.fromEntries(events.map((e) => [e.id, e.title]));

    // Also get ticket counts per event
    const ticketCounts = await prisma.eventTicket.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    });
    const ticketMap = Object.fromEntries(ticketCounts.map((t) => [t.eventId, t._count.id]));

    attendanceOverview = attendanceByEvent.map((a) => {
      const checkedIn = a._count.id;
      const registered = ticketMap[a.eventId] || 0;
      return {
        eventId: a.eventId,
        title: eventMap[a.eventId] || 'Unknown Event',
        checkedIn,
        registered,
        percentage: registered > 0 ? Math.round((checkedIn / registered) * 100) : 0,
      };
    });
  }

  // Build merchandise overview
  const merchandiseOverview = merchandiseProducts.map((p) => ({
    name: p.name,
    stock: p.stockQuantity,
  }));

  return {
    totalUsers,
    students,
    studentCount: students,
    studentLeaders,
    leaderCount: studentLeaders,
    admins,
    inactiveUsers,
    upcomingEvents: upcomingEventsCount,
    upcomingEventsList,
    volunteerApplications,
    approvedVolunteers,
    attendance,
    totalAttendance: attendance,
    merchandiseStock: merchandiseStock._sum.stockQuantity || 0,
    merchandiseTotalStock: merchandiseStock._sum.stockQuantity || 0,
    orders,
    orderCount: orders,
    announcements,
    announcementCount: announcements,
    volunteerOverview,
    attendanceOverview,
    merchandiseOverview,
  };
}

module.exports = { getStudentDashboard, getLeaderDashboard, getAdminDashboard };
