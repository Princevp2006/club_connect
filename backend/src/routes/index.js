// ─── Route Aggregator ────────────────────────────────────────────────────────
const { Router } = require('express');

// Phase 1
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

// Phase 2
const eventRoutes = require('./event.routes');
const membershipRoutes = require('./membership.routes');
const ticketRoutes = require('./ticket.routes');
const volunteerRoutes = require('./volunteer.routes');
const taskRoutes = require('./task.routes');

// Phase 3
const merchandiseRoutes = require('./merchandise.routes');
const orderRoutes = require('./order.routes');
const announcementRoutes = require('./announcement.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = Router();

// Phase 1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Phase 2
router.use('/events', eventRoutes);
router.use('/memberships', membershipRoutes);
router.use('/tickets', ticketRoutes);
router.use('/volunteer-applications', volunteerRoutes);
router.use('/tasks', taskRoutes);

// Phase 3
router.use('/merchandise', merchandiseRoutes);
router.use('/orders', orderRoutes);
router.use('/announcements', announcementRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
