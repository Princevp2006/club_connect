// ─── Membership Service ──────────────────────────────────────────────────────
const membershipRepo = require('../repositories/membership.repository');
const ApiError = require('../utils/apiError');

async function createMembership(data) {
  return membershipRepo.create({
    userId: data.userId,
    membershipType: data.membershipType,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    status: data.status || 'ACTIVE',
  });
}

async function getMyMemberships(userId) {
  return membershipRepo.findByUserId(userId);
}

async function listMemberships(query) {
  const { data, total } = await membershipRepo.findMany(query);
  const totalPages = Math.ceil(total / query.limit);

  return {
    data,
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
  if (data.status !== undefined) updateData.status = data.status;

  return membershipRepo.updateById(membershipId, updateData);
}

module.exports = { createMembership, getMyMemberships, listMemberships, updateMembership };
