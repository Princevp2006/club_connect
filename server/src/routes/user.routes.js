// ─── User Management Routes (ADMIN only) ─────────────────────────────────────
const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { changeRoleSchema, listUsersQuerySchema } = require('../schemas/user.schema');
const { UserRole } = require('../types');

const router = Router();

// All user management routes require authentication + ADMIN role
router.use(authenticateJWT, requireRole(UserRole.ADMIN));

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [User Management]
 *     summary: List all users (paginated)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name, email, or studentId
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, STUDENT_LEADER, STUDENT] }
 *       - in: query
 *         name: isActive
 *         schema: { type: string, enum: ['true', 'false'] }
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedUsers'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden – ADMIN only
 */
router.get('/', validate(listUsersQuerySchema, 'query'), userController.listUsers);

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     tags: [User Management]
 *     summary: Get user details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:userId', userController.getUser);

/**
 * @openapi
 * /users/{userId}/role:
 *   patch:
 *     tags: [User Management]
 *     summary: Change user role
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangeRoleRequest'
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Validation error or last-admin guard
 *       404:
 *         description: User not found
 */
router.patch('/:userId/role', validate(changeRoleSchema), userController.changeRole);

/**
 * @openapi
 * /users/{userId}/activate:
 *   patch:
 *     tags: [User Management]
 *     summary: Activate a user account
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User activated
 *       400:
 *         description: Already active
 *       404:
 *         description: User not found
 */
router.patch('/:userId/activate', userController.activateUser);

/**
 * @openapi
 * /users/{userId}/deactivate:
 *   patch:
 *     tags: [User Management]
 *     summary: Deactivate a user account
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deactivated
 *       400:
 *         description: Already inactive or last-admin guard
 *       404:
 *         description: User not found
 */
router.patch('/:userId/deactivate', userController.deactivateUser);

module.exports = router;
