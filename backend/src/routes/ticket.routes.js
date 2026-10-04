// ─── Ticket Routes ───────────────────────────────────────────────────────────
const { Router } = require('express');
const ticketController = require('../controllers/ticket.controller');
const authenticateJWT = require('../middleware/authenticate');

const router = Router();

/**
 * @openapi
 * /tickets/me:
 *   get:
 *     tags: [Event Tickets]
 *     summary: Get my tickets
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User's tickets
 */
router.get('/me', authenticateJWT, ticketController.getMyTickets);

module.exports = router;
