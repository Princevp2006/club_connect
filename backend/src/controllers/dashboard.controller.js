// ─── Dashboard Controller ────────────────────────────────────────────────────
const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/apiResponse');

async function studentDashboard(req, res, next) {
  try {
    const data = await dashboardService.getStudentDashboard(req.user.userId);
    return success(res, data, 'Student dashboard');
  } catch (err) { next(err); }
}

async function leaderDashboard(req, res, next) {
  try {
    const data = await dashboardService.getLeaderDashboard();
    return success(res, data, 'Student leader dashboard');
  } catch (err) { next(err); }
}

async function adminDashboard(req, res, next) {
  try {
    const data = await dashboardService.getAdminDashboard();
    return success(res, data, 'Admin dashboard');
  } catch (err) { next(err); }
}

module.exports = { studentDashboard, leaderDashboard, adminDashboard };
