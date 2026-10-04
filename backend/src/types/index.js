// ─── Shared Type Constants ────────────────────────────────────────────────────
// Since we are using plain JavaScript, these are exported constants rather than TS types.

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 1 – User Roles
// ═══════════════════════════════════════════════════════════════════════════════

/** @enum {string} */
const UserRole = Object.freeze({
  ADMIN: 'ADMIN',
  STUDENT_LEADER: 'STUDENT_LEADER',
  STUDENT: 'STUDENT',
});

const VALID_ROLES = Object.values(UserRole);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2 – Event Status
// ═══════════════════════════════════════════════════════════════════════════════

const EventStatus = Object.freeze({
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

const VALID_EVENT_STATUSES = Object.values(EventStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2 – Membership Status
// ═══════════════════════════════════════════════════════════════════════════════

const MembershipStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
});

const VALID_MEMBERSHIP_STATUSES = Object.values(MembershipStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2 – Ticket Status
// ═══════════════════════════════════════════════════════════════════════════════

const TicketStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
});

const VALID_TICKET_STATUSES = Object.values(TicketStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2 – Volunteer Application Status
// ═══════════════════════════════════════════════════════════════════════════════

const VolunteerApplicationStatus = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
});

const VALID_VOLUNTEER_APPLICATION_STATUSES = Object.values(VolunteerApplicationStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2 – Volunteer Task Type
// ═══════════════════════════════════════════════════════════════════════════════

const VolunteerTaskType = Object.freeze({
  QR_SCANNER: 'QR_SCANNER',
  REGISTRATION: 'REGISTRATION',
  SEATING: 'SEATING',
  HELP_DESK: 'HELP_DESK',
  EVENT_SETUP: 'EVENT_SETUP',
  OTHER: 'OTHER',
});

const VALID_VOLUNTEER_TASK_TYPES = Object.values(VolunteerTaskType);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 2 – Volunteer Task Status
// ═══════════════════════════════════════════════════════════════════════════════

const VolunteerTaskStatus = Object.freeze({
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
});

const VALID_VOLUNTEER_TASK_STATUSES = Object.values(VolunteerTaskStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3 – Order Status
// ═══════════════════════════════════════════════════════════════════════════════

const OrderStatus = Object.freeze({
  PLACED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  READY: 'READY',
  COLLECTED: 'COLLECTED',
  CANCELLED: 'CANCELLED',
});

const VALID_ORDER_STATUSES = Object.values(OrderStatus);

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 3 – Announcement Target Types
// ═══════════════════════════════════════════════════════════════════════════════

const AnnouncementTargetType = Object.freeze({
  ALL_MEMBERS: 'ALL_MEMBERS',
  EVENT_REGISTERED_USERS: 'EVENT_REGISTERED_USERS',
  SELECTED_MEMBERS: 'SELECTED_MEMBERS',
  STUDENT_LEADERS: 'STUDENT_LEADERS',
});

const VALID_ANNOUNCEMENT_TARGET_TYPES = Object.values(AnnouncementTargetType);

module.exports = {
  UserRole,
  VALID_ROLES,
  EventStatus,
  VALID_EVENT_STATUSES,
  MembershipStatus,
  VALID_MEMBERSHIP_STATUSES,
  TicketStatus,
  VALID_TICKET_STATUSES,
  VolunteerApplicationStatus,
  VALID_VOLUNTEER_APPLICATION_STATUSES,
  VolunteerTaskType,
  VALID_VOLUNTEER_TASK_TYPES,
  VolunteerTaskStatus,
  VALID_VOLUNTEER_TASK_STATUSES,
  OrderStatus,
  VALID_ORDER_STATUSES,
  AnnouncementTargetType,
  VALID_ANNOUNCEMENT_TARGET_TYPES,
};
