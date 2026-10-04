// ─── Dashboard Routes ────────────────────────────────────────────────────────
const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const { UserRole } = require('../types');

const router = Router();

router.use(authenticateJWT);

/**
 * @openapi
 * /dashboard/student:
 *   get:
 *     tags: [Dashboards]
 *     summary: Student dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data
 */
router.get('/student', requireRole(UserRole.STUDENT), dashboardController.studentDashboard);

/**
 * @openapi
 * /dashboard/student-leader:
 *   get:
 *     tags: [Dashboards]
 *     summary: Student leader dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Leader dashboard data
 */
router.get('/student-leader', requireRole(UserRole.STUDENT_LEADER), dashboardController.leaderDashboard);

/**
 * @openapi
 * /dashboard/admin:
 *   get:
 *     tags: [Dashboards]
 *     summary: Admin dashboard
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 */
router.get('/admin', requireRole(UserRole.ADMIN), dashboardController.adminDashboard);

module.exports = router;
