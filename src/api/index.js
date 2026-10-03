// Feature API modules. Endpoints marked "ASSUMED" are not explicitly listed in the
// spec but are required by the UI; verify them against the backend Swagger (/api-docs).
import { api } from "./apiClient";
export const authApi = {
  login: (body) => api.post("/auth/login", body, false),
  register: (body) => api.post("/auth/register", body, false),
  getMe: () => api.get("/auth/me"),
};
export const usersApi = {
  getUsers: (q) => api.get("/users", q),
  getUser: (id) => api.get(`/users/${id}`),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  activateUser: (id) => api.patch(`/users/${id}/activate`),
  deactivateUser: (id) => api.patch(`/users/${id}/deactivate`),
};
export const eventsApi = {
  getEvents: (q) => api.get("/events", q), // ASSUMED
  getEvent: (id) => api.get(`/events/${id}`), // ASSUMED
  createEvent: (body) => api.post("/events", body), // ASSUMED
  updateEvent: (id, body) => api.patch(`/events/${id}`, body), // ASSUMED
};
export const membershipApi = {
  getMine: () => api.get("/memberships/me"),
  getAll: (q) => api.get("/memberships", q),
  create: (body) => api.post("/memberships", body),
  update: (id, body) => api.patch(`/memberships/${id}`, body),
};
export const ticketsApi = {
  register: (eventId) => api.post(`/events/${eventId}/tickets`),
  getMine: () => api.get("/tickets/me"),
};
export const volunteerApi = {
  apply: (eventId) => api.post(`/events/${eventId}/volunteer-applications`),
  getMine: () => api.get("/volunteer-applications/me"), // ASSUMED
  getForEvent: (eventId) => api.get(`/events/${eventId}/volunteer-applications`), // ASSUMED
  approve: (id) => api.patch(`/volunteer-applications/${id}/approve`),
  reject: (id) => api.patch(`/volunteer-applications/${id}/reject`),
};
export const tasksApi = {
  create: (eventId, body) => api.post(`/events/${eventId}/tasks`, body),
  getForEvent: (eventId) => api.get(`/events/${eventId}/tasks`), // ASSUMED
  getMyTasks: () => api.get("/tasks/me"),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  reassign: (id, volunteerId) => api.patch(`/tasks/${id}/reassign`, { volunteerId }),
};
export const scannerApi = {
  getAccess: (eventId) => api.get(`/events/${eventId}/scanner/access`),
  checkIn: (eventId, ticketCode) => api.post(`/events/${eventId}/checkins`, { ticketCode }),
};
export const attendanceApi = {
  getAttendance: (eventId) => api.get(`/events/${eventId}/attendance`),
  getCount: (eventId) => api.get(`/events/${eventId}/attendance/count`),
};
export const merchandiseApi = {
  getProducts: (q) => api.get("/merchandise", q), // ASSUMED
  createProduct: (body) => api.post("/merchandise", body), // ASSUMED
  updateProduct: (id, body) => api.patch(`/merchandise/${id}`, body), // ASSUMED
  activate: (id) => api.patch(`/merchandise/${id}/activate`), // ASSUMED
  deactivate: (id) => api.patch(`/merchandise/${id}/deactivate`), // ASSUMED
};
export const ordersApi = {
  createOrder: (body) => api.post("/orders", body),
  getMyOrders: () => api.get("/orders/me"),
  getAllOrders: (q) => api.get("/orders", q),
};
export const announcementApi = {
  getAnnouncements: () => api.get("/announcements"),
  createAnnouncement: (body) => api.post("/announcements", body),
  updateAnnouncement: (id, body) => api.patch(`/announcements/${id}`, body),
  deleteAnnouncement: (id) => api.del(`/announcements/${id}`),
};
export const dashboardApi = {
  getStudentDashboard: () => api.get("/dashboard/student"),
  getStudentLeaderDashboard: () => api.get("/dashboard/student-leader"),
  getAdminDashboard: () => api.get("/dashboard/admin"),
};
