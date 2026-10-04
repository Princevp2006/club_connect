// ─── Membership Service ──────────────────────────────────────────────────────
const membershipRepo = require('../repositories/membership.repository');
const ApiError = require('../utils/apiError');
const { MembershipStatus } = require('../types');

// Membership type definitions and their durations
const MEMBERSHIP_TYPES = Object.freeze({
  SEMESTER: 'SEMESTER',
  ANNUAL: 'ANNUAL',
  LIFETIME: 'LIFETIME',
});

const VALID_MEMBERSHIP_TYPES = Object.values(MEMBERSHIP_TYPES);

/**
 * Calculate the end date based on membership type.
 * LIFETIME gets a far-future date (100 years).
 */
function calculateEndDate(startDate, membershipType) {
  const end = new Date(startDate);
  const type = String(membershipType || '').toUpperCase().trim();
  switch (type) {
    case MEMBERSHIP_TYPES.SEMESTER:
      end.setMonth(end.getMonth() + 6);
      break;
    case MEMBERSHIP_TYPES.ANNUAL:
      end.setFullYear(end.getFullYear() + 1);
      break;
    case MEMBERSHIP_TYPES.LIFETIME:
      end.setFullYear(end.getFullYear() + 100);
      break;
    default:
      end.setMonth(end.getMonth() + 6);
      break;
  }
  return end;
}

/**
 * Derive membership status dynamically based on dates and type
 * ensuring status validity is determined from dates rather than manual input.
 */
function deriveStatus(m) {
  if (!m) return MembershipStatus.EXPIRED;
  if (m.status === MembershipStatus.CANCELLED) return MembershipStatus.CANCELLED;
  if (m.status === MembershipStatus.EXPIRED) return MembershipStatus.EXPIRED;
  const type = String(m.membershipType || '').toUpperCase().trim();
  if (type === 'LIFETIME') return MembershipStatus.ACTIVE;
  const now = new Date();
  const end = new Date(m.endDate);
  return end >= now ? MembershipStatus.ACTIVE : MembershipStatus.EXPIRED;
}

/**
 * Idempotent subscribe – creates a membership for the authenticated student.
 * If the user already has an active membership, returns the existing one
 * instead of creating a duplicate.
 */
async function subscribe(userId, membershipType) {
  const normalizedType = String(membershipType || '').toUpperCase().trim();
  if (!VALID_MEMBERSHIP_TYPES.includes(normalizedType)) {
    throw ApiError.badRequest(
      `Invalid membership type. Must be one of: ${VALID_MEMBERSHIP_TYPES.join(', ')}`
    );
  }

  // Idempotency check – if user already has an ACTIVE membership, return it
  const existing = await membershipRepo.findByUserId(userId);
  const activeMembership = existing.find((m) => deriveStatus(m) === MembershipStatus.ACTIVE);
  if (activeMembership) {
    return {
      membership: { ...activeMembership, status: deriveStatus(activeMembership) },
      alreadyExisted: true,
    };
  }

  const startDate = new Date();
  const endDate = calculateEndDate(startDate, normalizedType);

  const created = await membershipRepo.create({
    userId,
    membershipType: normalizedType,
    startDate,
    endDate,
    status: MembershipStatus.ACTIVE,
  });

  return {
    membership: { ...created, status: deriveStatus(created) },
    alreadyExisted: false,
  };
}

async function createMembership(data) {
  const startDate = new Date(data.startDate);
  const endDate = data.endDate
    ? new Date(data.endDate)
    : calculateEndDate(startDate, data.membershipType);

  const status = data.status === MembershipStatus.CANCELLED
    ? MembershipStatus.CANCELLED
    : deriveStatus({ membershipType: data.membershipType, endDate });

  const created = await membershipRepo.create({
    userId: data.userId,
    membershipType: data.membershipType,
    startDate,
    endDate,
    status,
  });

  return { ...created, status: deriveStatus(created) };
}

async function getMyMemberships(userId) {
  const items = await membershipRepo.findByUserId(userId);
  return items.map((m) => ({ ...m, status: deriveStatus(m) }));
}

async function listMemberships(query) {
  const { data, total } = await membershipRepo.findMany(query);
  const totalPages = Math.ceil(total / query.limit);

  return {
    data: data.map((m) => ({ ...m, status: deriveStatus(m) })),
    meta: { total, page: query.page, limit: query.limit, totalPages },
  };
}

async function updateMembership(membershipId, data) {
  const membership = await membershipRepo.findById(membershipId);
  if (!membership) {
    throw ApiError.notFound('Membership not found');
  }

  const updateData = {};
  if (data.membershipType !== undefined) updateData.membershipType = data.membershipType;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

  // If type changed and no explicit endDate, recalculate
  if (data.membershipType && !data.endDate) {
    const start = data.startDate ? new Date(data.startDate) : membership.startDate;
    updateData.endDate = calculateEndDate(start, data.membershipType);
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  } else if (data.membershipType !== undefined || data.startDate !== undefined || data.endDate !== undefined) {
    const finalEnd = updateData.endDate || membership.endDate;
    const finalType = updateData.membershipType || membership.membershipType;
    updateData.status = deriveStatus({ membershipType: finalType, endDate: finalEnd, status: membership.status });
  }

  const updated = await membershipRepo.updateById(membershipId, updateData);
  return { ...updated, status: deriveStatus(updated) };
}

/**
 * Delete an inactive, expired, or cancelled membership record.
 * Active memberships cannot be deleted.
 */
async function deleteMembership(membershipId) {
  const membership = await membershipRepo.findById(membershipId);
  if (!membership) {
    throw ApiError.notFound('Membership not found');
  }

  const currentStatus = deriveStatus(membership);
  if (currentStatus === MembershipStatus.ACTIVE) {
    throw ApiError.badRequest(
      'Active memberships cannot be deleted. Only inactive, expired, or cancelled memberships can be deleted.'
    );
  }

  await membershipRepo.deleteById(membershipId);
  return { message: 'Membership deleted successfully' };
}

/**
 * Cancel the authenticated student's active membership.
 * Derives userId from the authenticated JWT session.
 */
async function cancelMyMembership(userId) {
  const memberships = await membershipRepo.findByUserId(userId);
  const active = memberships.find((m) => deriveStatus(m) === MembershipStatus.ACTIVE);

  if (!active) {
    throw ApiError.badRequest('No active membership found to cancel.');
  }

  const updated = await membershipRepo.updateById(active.id, {
    status: MembershipStatus.CANCELLED,
  });

  return { ...updated, status: MembershipStatus.CANCELLED };
}

module.exports = {
  subscribe,
  createMembership,
  getMyMemberships,
  listMemberships,
  updateMembership,
  deleteMembership,
  cancelMyMembership,
  calculateEndDate,
  deriveStatus,
  MEMBERSHIP_TYPES,
  VALID_MEMBERSHIP_TYPES,
};
