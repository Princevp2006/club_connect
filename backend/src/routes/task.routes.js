// ─── Task Routes ─────────────────────────────────────────────────────────────
const { Router } = require('express');
const volunteerController = require('../controllers/volunteer.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { reassignTaskSchema, updateTaskStatusSchema } = require('../schemas/volunteer.schema');
const { UserRole } = require('../types');

const router = Router();

/**
 * @openapi
 * /tasks/me:
 *   get:
 *     tags: [Volunteer Tasks]
 *     summary: Get tasks assigned to the authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's assigned tasks
 */
router.get('/me', authenticateJWT, volunteerController.getMyTasks);

/**
 * @openapi
 * /tasks/{taskId}/reassign:
 *   patch:
 *     tags: [Volunteer Tasks]
 *     summary: Reassign a task to another approved volunteer
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [volunteerUserId]
 *             properties:
 *               volunteerUserId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Task reassigned
 *       400:
 *         description: New assignee not an approved volunteer
 */
router.patch(
  '/:taskId/reassign',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  validate(reassignTaskSchema),
  volunteerController.reassignTask
);

/**
 * @openapi
 * /tasks/{taskId}/status:
 *   patch:
 *     tags: [Volunteer Tasks]
 *     summary: Update task status (assigned volunteer only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACCEPTED, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: Task status updated
 *       403:
 *         description: Not the assigned volunteer
 */
router.patch(
  '/:taskId/status',
  authenticateJWT,
  validate(updateTaskStatusSchema),
  volunteerController.updateTaskStatus
);

module.exports = router;
