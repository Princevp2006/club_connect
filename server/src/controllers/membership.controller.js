// ─── Membership Controller ───────────────────────────────────────────────────
const membershipService = require('../services/membership.service');
const { success, created } = require('../utils/apiResponse');

async function createMembership(req, res, next) {
  try {
    const membership = await membershipService.createMembership(req.body);
    return created(res, membership, 'Membership created');
  } catch (err) {
    next(err);
  }
}

async function getMyMemberships(req, res, next) {
  try {
    const memberships = await membershipService.getMyMemberships(req.user.userId);
    return success(res, memberships, 'Memberships retrieved');
  } catch (err) {
    next(err);
  }
}

async function listMemberships(req, res, next) {
  try {
    const result = await membershipService.listMemberships(req.query);
    return success(res, result, 'Memberships retrieved');
  } catch (err) {
    next(err);
  }
}

async function updateMembership(req, res, next) {
  try {
    const membership = await membershipService.updateMembership(req.params.membershipId, req.body);
    return success(res, membership, 'Membership updated');
  } catch (err) {
    next(err);
  }
}

module.exports = { createMembership, getMyMemberships, listMemberships, updateMembership };
