// ─── Event Routes ────────────────────────────────────────────────────────────
const { Router } = require('express');
const eventController = require('../controllers/event.controller');
const authenticateJWT = require('../middleware/authenticate');
const requireRole = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createEventSchema, updateEventSchema, listEventsQuerySchema } = require('../schemas/event.schema');
const { UserRole } = require('../types');

const router = Router();

/**
 * @openapi
 * /events:
 *   get:
 *     tags: [Events]
 *     summary: List events with pagination and filtering
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
 *         schema: { type: string, enum: [DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of events
 */
router.get(
  '/',
  authenticateJWT,
  validate(listEventsQuerySchema, 'query'),
  eventController.listEvents
);

/**
 * @openapi
 * /events:
 *   post:
 *     tags: [Events]
 *     summary: Create a new event
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEventRequest'
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post(
  '/',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  validate(createEventSchema),
  eventController.createEvent
);

/**
 * @openapi
 * /events/{eventId}:
 *   get:
 *     tags: [Events]
 *     summary: Get event details
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:eventId', authenticateJWT, eventController.getEvent);

/**
 * @openapi
 * /events/{eventId}:
 *   patch:
 *     tags: [Events]
 *     summary: Update an event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEventRequest'
 *     responses:
 *       200:
 *         description: Event updated
 *       404:
 *         description: Event not found
 */
router.patch(
  '/:eventId',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  validate(updateEventSchema),
  eventController.updateEvent
);

/**
 * @openapi
 * /events/{eventId}:
 *   delete:
 *     tags: [Events]
 *     summary: Delete a DRAFT event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event deleted
 *       400:
 *         description: Only DRAFT events can be deleted
 *       404:
 *         description: Event not found
 */
router.delete(
  '/:eventId',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  eventController.deleteEvent
);

// ── Nested: Event Tickets ───────────────────────────
const ticketController = require('../controllers/ticket.controller');

/**
 * @openapi
 * /events/{eventId}/tickets:
 *   post:
 *     tags: [Event Tickets]
 *     summary: Register for an event ticket
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Ticket registered
 *       409:
 *         description: Already registered
 */
router.post(
  '/:eventId/tickets',
  authenticateJWT,
  ticketController.registerTicket
);

/**
 * @openapi
 * /events/{eventId}/tickets:
 *   get:
 *     tags: [Event Tickets]
 *     summary: Get all tickets for an event (ADMIN / STUDENT_LEADER)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event tickets
 */
router.get(
  '/:eventId/tickets',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  ticketController.getEventTickets
);

// ── Nested: Volunteer Applications ──────────────────
const volunteerController = require('../controllers/volunteer.controller');

/**
 * @openapi
 * /events/{eventId}/volunteer-applications:
 *   post:
 *     tags: [Volunteer Applications]
 *     summary: Apply to volunteer for an event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Application submitted
 *       400:
 *         description: Event does not require volunteers
 *       409:
 *         description: Already applied or limit reached
 */
router.post(
  '/:eventId/volunteer-applications',
  authenticateJWT,
  requireRole(UserRole.STUDENT),
  volunteerController.applyToVolunteer
);

/**
 * @openapi
 * /events/{eventId}/volunteer-applications:
 *   get:
 *     tags: [Volunteer Applications]
 *     summary: List volunteer applications for an event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Volunteer applications list
 */
router.get(
  '/:eventId/volunteer-applications',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  volunteerController.getEventApplications
);

// ── Nested: Volunteer Tasks ─────────────────────────
const { createTaskSchema } = require('../schemas/volunteer.schema');

/**
 * @openapi
 * /events/{eventId}/tasks:
 *   post:
 *     tags: [Volunteer Tasks]
 *     summary: Assign a task to an approved volunteer
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Volunteer not approved
 */
router.post(
  '/:eventId/tasks',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  validate(createTaskSchema),
  volunteerController.createTask
);

/**
 * @openapi
 * /events/{eventId}/tasks:
 *   get:
 *     tags: [Volunteer Tasks]
 *     summary: List all tasks for an event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event tasks
 */
router.get(
  '/:eventId/tasks',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  volunteerController.getEventTasks
);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3 – QR Scanner & Attendance
// ═══════════════════════════════════════════════════════════════════════════════
const checkinController = require('../controllers/checkin.controller');
const requireQrScanner = require('../middleware/requireQrScanner');
const { scanTicketSchema } = require('../schemas/checkin.schema');

/**
 * @openapi
 * /events/{eventId}/scanner/access:
 *   get:
 *     tags: [QR Scanner]
 *     summary: Check if user has QR scanner access for this event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Scanner access granted
 *       403:
 *         description: No scanner access
 */
router.get('/:eventId/scanner/access', authenticateJWT, checkinController.checkScannerAccess);

/**
 * @openapi
 * /events/{eventId}/checkins:
 *   post:
 *     tags: [QR Scanner]
 *     summary: Scan a ticket (QR_SCANNER task holders only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketCode]
 *             properties:
 *               ticketCode: { type: string }
 *     responses:
 *       200:
 *         description: Ticket verified
 *       403:
 *         description: No QR scanner access
 *       404:
 *         description: Invalid ticket
 *       409:
 *         description: Ticket already checked in
 */
router.post(
  '/:eventId/checkins',
  authenticateJWT,
  requireQrScanner,
  validate(scanTicketSchema),
  checkinController.scanTicket
);

/**
 * @openapi
 * /events/{eventId}/attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance records for an event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Attendance records
 */
router.get(
  '/:eventId/attendance',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  checkinController.getEventAttendance
);

/**
 * @openapi
 * /events/{eventId}/attendance/count:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance count for an event
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Attendance count
 */
router.get(
  '/:eventId/attendance/count',
  authenticateJWT,
  requireRole(UserRole.ADMIN, UserRole.STUDENT_LEADER),
  checkinController.getEventAttendanceCount
);

module.exports = router;
