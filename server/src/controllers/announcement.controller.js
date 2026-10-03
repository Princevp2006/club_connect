// ─── Announcement Controller ─────────────────────────────────────────────────
const announcementService = require('../services/announcement.service');
const { success, created } = require('../utils/apiResponse');
const { UserRole } = require('../types');

async function createAnnouncement(req, res, next) {
  try {
    const announcement = await announcementService.createAnnouncement(req.body, req.user.userId);
    return created(res, announcement, 'Announcement created');
  } catch (err) { next(err); }
}

async function listAnnouncements(req, res, next) {
  try {
    const isAdmin = req.user && [UserRole.ADMIN, UserRole.STUDENT_LEADER].includes(req.user.role);
    const result = await announcementService.listAnnouncements(req.query, isAdmin);
    return success(res, result, 'Announcements retrieved');
  } catch (err) { next(err); }
}

async function updateAnnouncement(req, res, next) {
  try {
    const announcement = await announcementService.updateAnnouncement(req.params.announcementId, req.body);
    return success(res, announcement, 'Announcement updated');
  } catch (err) { next(err); }
}

async function deleteAnnouncement(req, res, next) {
  try {
    await announcementService.deleteAnnouncement(req.params.announcementId);
    return success(res, null, 'Announcement deleted');
  } catch (err) { next(err); }
}

module.exports = { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement };
