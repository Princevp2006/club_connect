// Feature API modules. Every call goes through the centralized apiClient.
// Endpoint paths are relative to VITE_API_BASE_URL (/api/v1).
import { api } from "./apiClient";

export const authApi = {
  login: (body) => api.post("/auth/login", body, false),
  register: (body) => api.post("/auth/register", body, false),
  getMe: () => api.get("/auth/me"),
};

export const usersApi = {
  getUsers: (q) => api.get("/users", q),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, body) => api.patch(`/users/${id}`, body),
  changeRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  activateUser: (id) => api.patch(`/users/${id}/activate`),
  deactivateUser: (id) => api.patch(`/users/${id}/deactivate`),
};

export const eventsApi = {
  getEvents: (q) => api.get("/events", q),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (body) => api.post("/events", body),
  updateEvent: (id, body) => api.patch(`/events/${id}`, body),
  deleteEvent: (id) => api.del(`/events/${id}`),
};

export const membershipApi = {
  getMine: () => api.get("/memberships/me"),
  getAll: (q) => api.get("/memberships", q),
  create: (body) => api.post("/memberships", body),
  update: (id, body) => api.patch(`/memberships/${id}`, body),
  delete: (id) => api.del(`/memberships/${id}`),
  cancelMine: () => api.post("/memberships/me/cancel"),
  subscribe: (membershipType) => api.post("/memberships/subscribe", { membershipType }),
};

export const ticketsApi = {
  register: (eventId) => api.post(`/events/${eventId}/tickets`),
  getMine: () => api.get("/tickets/me"),
  getForEvent: (eventId) => api.get(`/events/${eventId}/tickets`),
};

export const volunteerApi = {
  getAll: (q) => api.get("/volunteer-applications", q),
  apply: (eventId) => api.post(`/events/${eventId}/volunteer-applications`),
  getMine: () => api.get("/volunteer-applications/me"),
  getForEvent: (eventId) => api.get(`/events/${eventId}/volunteer-applications`),
  approve: (id) => api.patch(`/volunteer-applications/${id}/approve`),
  reject: (id) => api.patch(`/volunteer-applications/${id}/reject`),
};

export const tasksApi = {
  create: (eventId, body) => api.post(`/events/${eventId}/tasks`, body),
  getForEvent: (eventId) => api.get(`/events/${eventId}/tasks`),
  getMyTasks: () => api.get("/tasks/me"),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  reassign: (id, volunteerId) =>
    api.patch(`/tasks/${id}/reassign`, { volunteerId, volunteerUserId: volunteerId }),
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
  getProducts: (q) => api.get("/merchandise", q),
  getProduct: (id) => api.get(`/merchandise/${id}`),
  createProduct: (body) => api.post("/merchandise", body),
  updateProduct: (id, body) => api.patch(`/merchandise/${id}`, body),
  // Backend uses single PATCH with { isActive: true/false } — no separate activate/deactivate routes
  activate: (id) => api.patch(`/merchandise/${id}`, { isActive: true }),
  deactivate: (id) => api.patch(`/merchandise/${id}`, { isActive: false }),
};

export const ordersApi = {
  createOrder: (body) => api.post("/orders", body),
  getMyOrders: () => api.get("/orders/me"),
  getAllOrders: (q) => api.get("/orders", q),
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
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
