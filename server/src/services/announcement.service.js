// ─── Announcement Service ────────────────────────────────────────────────────
const announcementRepo = require('../repositories/announcement.repository');
const ApiError = require('../utils/apiError');

async function createAnnouncement(data, createdById) {
  return announcementRepo.create({
    title: data.title,
    content: data.content,
    createdById,
    isPublished: data.isPublished || false,
    publishedAt: data.isPublished ? new Date() : null,
  });
}

async function listAnnouncements(query, isAdmin) {
  // Non-admin/leader users see only published announcements
  const { data, total } = await announcementRepo.findMany({
    ...query,
    publishedOnly: !isAdmin,
  });
  const totalPages = Math.ceil(total / query.limit);
  return { data, meta: { total, page: query.page, limit: query.limit, totalPages } };
}

async function updateAnnouncement(id, data) {
  const announcement = await announcementRepo.findById(id);
  if (!announcement) throw ApiError.notFound('Announcement not found');

  const updateData = { ...data };
  // If publishing for the first time, set publishedAt
  if (data.isPublished && !announcement.isPublished) {
    updateData.publishedAt = new Date();
  }

  return announcementRepo.updateById(id, updateData);
}

async function deleteAnnouncement(id) {
  const announcement = await announcementRepo.findById(id);
  if (!announcement) throw ApiError.notFound('Announcement not found');
  return announcementRepo.deleteById(id);
}

module.exports = { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement };
