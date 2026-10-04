// ─── Volunteer Application Routes ────────────────────────────────────────────
const { Router } = require('express');
const volunteerController = require('../controllers/volunteer.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const { UserRole } = require('../types');

const router = Router();

/**
 * @openapi
 * /volunteer-applications:
 *   get:
 *     tags: [Volunteer Applications]
 *     summary: List all volunteer applications (ADMIN / STUDENT_LEADER)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, APPROVED, REJECTED] }
 *     responses:
 *       200:
 *         description: Volunteer applications list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  volunteerController.getAllApplications
);

/**
 * @openapi
 * /volunteer-applications/me:
 *   get:
 *     tags: [Volunteer Applications]
 *     summary: Get my volunteer applications
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's volunteer applications
 */
router.get('/me', authenticateJWT, volunteerController.getMyApplications);

/**
 * @openapi
 * /volunteer-applications/{applicationId}/approve:
 *   patch:
 *     tags: [Volunteer Applications]
 *     summary: Approve a volunteer application
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Application approved
 *       400:
 *         description: Application not pending
 *       409:
 *         description: Volunteer limit reached
 */
router.patch(
  '/:applicationId/approve',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  volunteerController.approveApplication
);

/**
 * @openapi
 * /volunteer-applications/{applicationId}/reject:
 *   patch:
 *     tags: [Volunteer Applications]
 *     summary: Reject a volunteer application
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Application rejected
 *       400:
 *         description: Application not pending
 */
router.patch(
  '/:applicationId/reject',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  volunteerController.rejectApplication
);

module.exports = router;
