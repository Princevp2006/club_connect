// ─── Membership Routes ───────────────────────────────────────────────────────
const { Router } = require('express');
const membershipController = require('../controllers/membership.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
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

module.exports = router;
