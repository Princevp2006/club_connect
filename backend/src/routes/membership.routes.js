// ─── Membership Routes ───────────────────────────────────────────────────────
const { Router } = require('express');
const membershipController = require('../controllers/membership.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  subscribeMembershipSchema,
  createMembershipSchema,
  updateMembershipSchema,
  listMembershipsQuerySchema,
} = require('../schemas/membership.schema');
const { UserRole } = require('../types');

const router = Router();

// All membership routes require authentication
router.use(authenticateJWT);

/**
 * @openapi
 * /memberships/me:
 *   get:
 *     tags: [Memberships]
 *     summary: Get my memberships
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's memberships
 */
router.get('/me', membershipController.getMyMemberships);

/**
 * @openapi
 * /memberships/subscribe:
 *   post:
 *     tags: [Memberships]
 *     summary: Subscribe to a membership plan (student self-service)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [membershipType]
 *             properties:
 *               membershipType:
 *                 type: string
 *                 enum: [SEMESTER, ANNUAL, LIFETIME]
 *     responses:
 *       201:
 *         description: Membership activated
 *       200:
 *         description: Already has an active membership (idempotent)
 */
router.post(
  '/subscribe',
  validate(subscribeMembershipSchema),
  membershipController.subscribe
);

/**
 * @openapi
 * /memberships:
 *   get:
 *     tags: [Memberships]
 *     summary: List all memberships (ADMIN)
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
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, EXPIRED, CANCELLED] }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated memberships
 */
router.get(
  '/',
  requireRole(UserRole.ADMIN),
  validate(listMembershipsQuerySchema, 'query'),
  membershipController.listMemberships
);

/**
 * @openapi
 * /memberships:
 *   post:
 *     tags: [Memberships]
 *     summary: Create a membership (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMembershipRequest'
 *     responses:
 *       201:
 *         description: Membership created
 */
router.post(
  '/',
  requireRole(UserRole.ADMIN),
  validate(createMembershipSchema),
  membershipController.createMembership
);

/**
 * @openapi
 * /memberships/{membershipId}:
 *   patch:
 *     tags: [Memberships]
 *     summary: Update a membership (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: membershipId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMembershipRequest'
 *     responses:
 *       200:
 *         description: Membership updated
 *       404:
 *         description: Membership not found
 */
router.patch(
  '/:membershipId',
  requireRole(UserRole.ADMIN),
  validate(updateMembershipSchema),
  membershipController.updateMembership
);

/**
 * @openapi
 * /memberships/me/cancel:
 *   post:
 *     tags: [Memberships]
 *     summary: Cancel my active membership (STUDENT)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Membership cancelled successfully
 *       400:
 *         description: No active membership found
 */
router.post(
  '/me/cancel',
  membershipController.cancelMyMembership
);

/**
 * @openapi
 * /memberships/{membershipId}:
 *   delete:
 *     tags: [Memberships]
 *     summary: Delete an inactive, expired or cancelled membership (ADMIN)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: membershipId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Membership deleted successfully
 *       400:
 *         description: Cannot delete active membership
 *       404:
 *         description: Membership not found
 */
router.delete(
  '/:membershipId',
  requireRole(UserRole.ADMIN),
  membershipController.deleteMembership
);

module.exports = router;
