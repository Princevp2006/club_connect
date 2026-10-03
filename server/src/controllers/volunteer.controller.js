// ─── Volunteer Controller ────────────────────────────────────────────────────
const volunteerService = require('../services/volunteer.service');
const { success, created } = require('../utils/apiResponse');

// ── Applications ────────────────────────────────────

async function applyToVolunteer(req, res, next) {
  try {
    const application = await volunteerService.applyToVolunteer(req.params.eventId, req.user.userId);
    return created(res, application, 'Volunteer application submitted');
  } catch (err) {
    next(err);
  }
}

async function getEventApplications(req, res, next) {
  try {
    const applications = await volunteerService.getEventApplications(req.params.eventId);
    return success(res, applications, 'Volunteer applications retrieved');
  } catch (err) {
    next(err);
  }
}

async function getMyApplications(req, res, next) {
  try {
    const applications = await volunteerService.getMyApplications(req.user.userId);
    return success(res, applications, 'Your volunteer applications retrieved');
  } catch (err) {
    next(err);
  }
}

async function approveApplication(req, res, next) {
  try {
    const application = await volunteerService.approveApplication(
      req.params.applicationId,
      req.user.userId
    );
    return success(res, application, 'Volunteer application approved');
  } catch (err) {
    next(err);
  }
}

async function rejectApplication(req, res, next) {
  try {
    const application = await volunteerService.rejectApplication(
      req.params.applicationId,
      req.user.userId
    );
    return success(res, application, 'Volunteer application rejected');
  } catch (err) {
    next(err);
  }
}

// ── Tasks ───────────────────────────────────────────

async function createTask(req, res, next) {
  try {
    const task = await volunteerService.createTask(req.params.eventId, req.body, req.user.userId);
    return created(res, task, 'Volunteer task created');
  } catch (err) {
    next(err);
  }
}

async function getMyTasks(req, res, next) {
  try {
    const tasks = await volunteerService.getMyTasks(req.user.userId);
    return success(res, tasks, 'Your tasks retrieved');
  } catch (err) {
    next(err);
  }
}

async function getEventTasks(req, res, next) {
  try {
    const tasks = await volunteerService.getEventTasks(req.params.eventId);
    return success(res, tasks, 'Event tasks retrieved');
  } catch (err) {
    next(err);
  }
}

async function reassignTask(req, res, next) {
  try {
    const task = await volunteerService.reassignTask(
      req.params.taskId,
      req.body.volunteerUserId,
      req.user.userId
    );
    return success(res, task, 'Task reassigned');
  } catch (err) {
    next(err);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const task = await volunteerService.updateTaskStatus(
      req.params.taskId,
      req.body.status,
      req.user.userId
    );
    return success(res, task, 'Task status updated');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  applyToVolunteer,
  getEventApplications,
  getMyApplications,
  approveApplication,
  rejectApplication,
  createTask,
  getMyTasks,
  getEventTasks,
  reassignTask,
  updateTaskStatus,
};
