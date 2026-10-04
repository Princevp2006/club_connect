// ─── Announcement Routes ─────────────────────────────────────────────────────
const { Router } = require('express');
const announcementController = require('../controllers/announcement.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createAnnouncementSchema, updateAnnouncementSchema, listAnnouncementsQuerySchema } = require('../schemas/announcement.schema');
const { UserRole } = require('../types');

const router = Router();

/**
 * @openapi
 * /announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: List announcements (published only for non-admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Announcements list
 */
router.get('/', authenticateJWT, validate(listAnnouncementsQuerySchema, 'query'), announcementController.listAnnouncements);

/**
 * @openapi
 * /announcements:
 *   post:
 *     tags: [Announcements]
 *     summary: Create an announcement (ADMIN / STUDENT_LEADER)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAnnouncementRequest'
 *     responses:
 *       201:
 *         description: Announcement created
 */
router.post('/', authenticateJWT, requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER), validate(createAnnouncementSchema), announcementController.createAnnouncement);

/**
 * @openapi
 * /announcements/{announcementId}:
 *   patch:
 *     tags: [Announcements]
 *     summary: Update an announcement (ADMIN / STUDENT_LEADER)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAnnouncementRequest'
 *     responses:
 *       200:
 *         description: Announcement updated
 */
router.patch('/:announcementId', authenticateJWT, requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER), validate(updateAnnouncementSchema), announcementController.updateAnnouncement);

/**
 * @openapi
 * /announcements/{announcementId}:
 *   delete:
 *     tags: [Announcements]
 *     summary: Delete an announcement (ADMIN only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: announcementId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Announcement deleted
 */
router.delete('/:announcementId', authenticateJWT, requireRole(UserRole.ADMIN), announcementController.deleteAnnouncement);

module.exports = router;
