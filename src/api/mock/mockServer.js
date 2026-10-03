// @ts-nocheck -- isolated demo data layer
// Isolated demo data layer. Only loaded when VITE_USE_MOCK_API === "true".
// Never imported by production code paths otherwise.
import { ApiError } from "../apiClient";
const KEY = "som.mock.db.v1";
const PASSWORD = "password123";
function seed() {
  const u = (id, fullName, email, role, studentId, isActive = true) => ({
    id,
    fullName,
    email,
    role,
    studentId,
    phone: "+1 555 01" + id.padStart(2, "0"),
    isActive,
    createdAt: "2026-08-2" + (Number(id) % 9) + "T09:00:00Z",
  });
  const users = [
    u("1", "Amara Okafor", "admin@uni.edu", "ADMIN", "STF-0001"),
    u("2", "Daniel Reyes", "leader@uni.edu", "STUDENT_LEADER", "S20230112"),
    u("3", "Priya Nair", "student@uni.edu", "STUDENT", "S20240231"),
    u("4", "Lucas Martin", "lucas@uni.edu", "STUDENT", "S20240455"),
    u("5", "Hana Sato", "hana@uni.edu", "STUDENT", "S20250019"),
    u("6", "Omar Haddad", "omar@uni.edu", "STUDENT", "S20230877"),
    u("7", "Grace Liu", "grace@uni.edu", "STUDENT_LEADER", "S20220334"),
    u("8", "Tomás Silva", "tomas@uni.edu", "STUDENT", "S20240990", false),
  ];
  const events = [
    {
      id: "1",
      title: "Freshers' Welcome Fair",
      description: "Meet every society on campus, grab freebies and sign up for the year ahead.",
      eventDate: "2026-10-10",
      startTime: "10:00",
      endTime: "16:00",
      location: "Main Quad",
      status: "PUBLISHED",
      needsVolunteers: true,
      volunteerLimit: 12,
    },
    {
      id: "2",
      title: "Hackathon: Build for Campus",
      description: "A 24-hour hackathon focused on tools that improve student life.",
      eventDate: "2026-10-24",
      startTime: "09:00",
      endTime: "21:00",
      location: "Engineering Hall B",
      status: "PUBLISHED",
      needsVolunteers: true,
      volunteerLimit: 8,
    },
    {
      id: "3",
      title: "Guest Lecture: Ethics in AI",
      description: "An evening talk followed by an open Q&A session.",
      eventDate: "2026-11-05",
      startTime: "18:00",
      endTime: "20:00",
      location: "Auditorium 1",
      status: "PUBLISHED",
      needsVolunteers: false,
      volunteerLimit: null,
    },
    {
      id: "4",
      title: "Winter Charity Gala",
      description: "Formal dinner raising awareness for local shelters.",
      eventDate: "2026-12-12",
      startTime: "19:00",
      endTime: "23:00",
      location: "Grand Hall",
      status: "DRAFT",
      needsVolunteers: true,
      volunteerLimit: 20,
    },
    {
      id: "5",
      title: "Orientation Campus Tour",
      description: "Guided tours for new students.",
      eventDate: "2026-09-12",
      startTime: "11:00",
      endTime: "13:00",
      location: "Library Steps",
      status: "COMPLETED",
      needsVolunteers: false,
      volunteerLimit: null,
    },
  ];
  const tickets = [
    {
      id: "1",
      ticketCode: "FWF-7K2Q9A",
      eventId: "1",
      userId: "3",
      status: "ACTIVE",
      createdAt: "2026-09-28T10:12:00Z",
    },
    {
      id: "2",
      ticketCode: "FWF-3MZ8LP",
      eventId: "1",
      userId: "4",
      status: "ACTIVE",
      createdAt: "2026-09-29T14:20:00Z",
    },
    {
      id: "3",
      ticketCode: "FWF-9QX1RT",
      eventId: "1",
      userId: "5",
      status: "CANCELLED",
      createdAt: "2026-09-29T15:00:00Z",
    },
    {
      id: "4",
      ticketCode: "HCK-4NB6WE",
      eventId: "2",
      userId: "3",
      status: "ACTIVE",
      createdAt: "2026-10-01T09:00:00Z",
    },
    {
      id: "5",
      ticketCode: "FWF-2HD5YU",
      eventId: "1",
      userId: "6",
      status: "ACTIVE",
      createdAt: "2026-09-30T08:00:00Z",
    },
  ];
  const applications = [
    {
      id: "1",
      eventId: "1",
      userId: "3",
      status: "APPROVED",
      appliedAt: "2026-09-20T10:00:00Z",
      reviewedAt: "2026-09-21T12:00:00Z",
    },
    {
      id: "2",
      eventId: "1",
      userId: "4",
      status: "PENDING",
      appliedAt: "2026-09-25T10:00:00Z",
      reviewedAt: null,
    },
    {
      id: "3",
      eventId: "2",
      userId: "5",
      status: "APPROVED",
      appliedAt: "2026-09-26T10:00:00Z",
      reviewedAt: "2026-09-27T10:00:00Z",
    },
    {
      id: "4",
      eventId: "2",
      userId: "6",
      status: "REJECTED",
      appliedAt: "2026-09-26T11:00:00Z",
      reviewedAt: "2026-09-27T11:00:00Z",
    },
    {
      id: "5",
      eventId: "2",
      userId: "3",
      status: "PENDING",
      appliedAt: "2026-10-01T11:00:00Z",
      reviewedAt: null,
    },
  ];
  const tasks = [
    {
      id: "1",
      eventId: "1",
      volunteerId: "3",
      taskType: "QR_SCANNER",
      title: "Gate A ticket scanning",
      description: "Scan tickets at the main gate.",
      startTime: "2026-10-10T09:30",
      endTime: "2026-10-10T13:00",
      location: "Main Quad — Gate A",
      status: "ACCEPTED",
    },
    {
      id: "2",
      eventId: "2",
      volunteerId: "5",
      taskType: "HELP_DESK",
      title: "Help desk shift",
      description: "Answer participant questions.",
      startTime: "2026-10-24T09:00",
      endTime: "2026-10-24T13:00",
      location: "Engineering Hall B lobby",
      status: "ASSIGNED",
    },
  ];
  const memberships = [
    {
      id: "1",
      userId: "3",
      membershipType: "ANNUAL",
      startDate: "2026-09-01",
      endDate: "2027-08-31",
      status: "ACTIVE",
    },
    {
      id: "2",
      userId: "4",
      membershipType: "SEMESTER",
      startDate: "2026-01-15",
      endDate: "2026-06-30",
      status: "EXPIRED",
    },
    {
      id: "3",
      userId: "6",
      membershipType: "ANNUAL",
      startDate: "2026-09-01",
      endDate: "2027-08-31",
      status: "ACTIVE",
    },
  ];
  const products = [
    {
      id: "1",
      name: "Society Hoodie",
      description: "Heavyweight cotton hoodie with embroidered crest.",
      size: "M",
      stock: 24,
      isActive: true,
    },
    {
      id: "2",
      name: "Society Hoodie",
      description: "Heavyweight cotton hoodie with embroidered crest.",
      size: "L",
      stock: 3,
      isActive: true,
    },
    {
      id: "3",
      name: "Enamel Pin Set",
      description: "Three collectible enamel pins.",
      size: "One size",
      stock: 80,
      isActive: true,
    },
    {
      id: "4",
      name: "Canvas Tote",
      description: "Natural canvas tote bag.",
      size: "One size",
      stock: 0,
      isActive: false,
    },
  ];
  const orders = [
    {
      id: "1",
      productId: "1",
      userId: "3",
      quantity: 1,
      status: "READY",
      createdAt: "2026-09-22T10:00:00Z",
    },
    {
      id: "2",
      productId: "3",
      userId: "4",
      quantity: 2,
      status: "PLACED",
      createdAt: "2026-09-30T10:00:00Z",
    },
  ];
  const announcements = [
    {
      id: "1",
      title: "Volunteer briefing this Thursday",
      content:
        "All approved volunteers for the Welcome Fair should attend the briefing at 5 PM in Room 204.",
      isPublished: true,
      publishedAt: "2026-10-01T09:00:00Z",
      createdById: "2",
      createdAt: "2026-10-01T08:50:00Z",
    },
    {
      id: "2",
      title: "Hackathon registrations open",
      content: "Teams of up to four. Register for a ticket on the event page.",
      isPublished: true,
      publishedAt: "2026-09-28T09:00:00Z",
      createdById: "1",
      createdAt: "2026-09-28T08:00:00Z",
    },
    {
      id: "3",
      title: "Gala planning (draft)",
      content: "Internal planning notes for the Winter Gala.",
      isPublished: false,
      publishedAt: null,
      createdById: "1",
      createdAt: "2026-09-30T08:00:00Z",
    },
  ];
  const checkins = [
    { id: "1", ticketId: "5", eventId: "1", scannedById: "3", scannedAt: "2026-10-03T08:10:00Z" },
  ];
  return {
    users,
    events,
    tickets,
    applications,
    tasks,
    memberships,
    products,
    orders,
    announcements,
    checkins,
    seq: { n: 100 },
  };
}
let db = null;
function getDb() {
  if (db) return db;
  try {
    const raw = window.localStorage.getItem(KEY);
    db = raw ? JSON.parse(raw) : seed();
  } catch {
    db = seed();
  }
  return db;
}
const save = () => window.localStorage.setItem(KEY, JSON.stringify(db));
const nextId = () => String(++getDb().seq.n);
const now = () => new Date().toISOString();
const fail = (status, message, errors) => {
  throw new ApiError(status, message, errors, "mock-" + Math.random().toString(36).slice(2, 10));
};
const pubUser = (x) =>
  x && {
    id: x.id,
    fullName: x.fullName,
    email: x.email,
    studentId: x.studentId,
    phone: x.phone,
    role: x.role,
    isActive: x.isActive,
    createdAt: x.createdAt,
  };
const userById = (id) => getDb().users.find((x) => x.id === id);
const eventById = (id) => getDb().events.find((x) => x.id === id);
const lite = (e) =>
  e && {
    id: e.id,
    title: e.title,
    eventDate: e.eventDate,
    startTime: e.startTime,
    endTime: e.endTime,
    location: e.location,
    status: e.status,
  };
const ticketOut = (t) => ({
  ...t,
  event: lite(eventById(t.eventId)),
  user: pubUser(userById(t.userId)),
});
const appOut = (a) => ({
  ...a,
  event: lite(eventById(a.eventId)),
  user: pubUser(userById(a.userId)),
});
const taskOut = (t) => ({
  ...t,
  event: lite(eventById(t.eventId)),
  volunteer: pubUser(userById(t.volunteerId)),
});
const orderOut = (o) => ({
  ...o,
  product: getDb().products.find((p) => p.id === o.productId),
  user: pubUser(userById(o.userId)),
});
const annOut = (a) => ({ ...a, createdBy: pubUser(userById(a.createdById)) });
const memOut = (m) => ({ ...m, user: pubUser(userById(m.userId)) });
const checkinOut = (c) => {
  const t = getDb().tickets.find((x) => x.id === c.ticketId);
  return {
    ...c,
    ticket: t && { id: t.id, ticketCode: t.ticketCode },
    attendee: pubUser(userById(t?.userId)),
    scannedBy: pubUser(userById(c.scannedById)),
  };
};
const isUpcoming = (e) => ["PUBLISHED", "ONGOING"].includes(e.status);
function count(eventId) {
  const d = getDb();
  const registered = d.tickets.filter(
    (t) => t.eventId === eventId && t.status !== "CANCELLED",
  ).length;
  const checkedIn = d.checkins.filter((c) => c.eventId === eventId).length;
  return {
    registered,
    checkedIn,
    notCheckedIn: Math.max(registered - checkedIn, 0),
    percentage: registered ? Math.round((checkedIn / registered) * 100) : 0,
  };
}
const staff = ["ADMIN", "STUDENT_LEADER"];
const routes = [
  [
    "POST",
    "/auth/login",
    "public",
    ({ body }) => {
      const user = getDb().users.find(
        (x) => x.email.toLowerCase() === String(body?.email).toLowerCase(),
      );
      if (!user || body?.password !== PASSWORD) fail(401, "Invalid email or password.");
      if (!user.isActive) fail(403, "Your account is inactive. Please contact an administrator.");
      return { token: "mock-token-" + user.id, user: pubUser(user) };
    },
  ],
  [
    "POST",
    "/auth/register",
    "public",
    ({ body }) => {
      const d = getDb();
      if (d.users.some((x) => x.email.toLowerCase() === String(body.email).toLowerCase()))
        fail(409, "An account with this email already exists.", {
          email: "Email already registered",
        });
      const user = {
        id: nextId(),
        fullName: body.fullName,
        email: body.email,
        studentId: body.studentId,
        phone: body.phone,
        role: "STUDENT",
        isActive: true,
        createdAt: now(),
      };
      d.users.push(user);
      return { user: pubUser(user) };
    },
  ],
  ["GET", "/auth/me", "any", ({ me }) => pubUser(me)],
  [
    "GET",
    "/users",
    ["ADMIN"],
    ({ query }) => {
      let list = getDb().users.map(pubUser);
      if (query.search) {
        const s = String(query.search).toLowerCase();
        list = list.filter((x) =>
          [x.fullName, x.email, x.studentId].some((v) => v?.toLowerCase().includes(s)),
        );
      }
      if (query.role) list = list.filter((x) => x.role === query.role);
      if (query.isActive) list = list.filter((x) => String(x.isActive) === query.isActive);
      const page = Number(query.page || 1),
        limit = Number(query.limit || 10);
      return {
        items: list.slice((page - 1) * limit, page * limit),
        total: list.length,
        page,
        limit,
      };
    },
  ],
  [
    "GET",
    "/users/:id",
    ["ADMIN"],
    ({ p }) => pubUser(userById(p[0])) ?? fail(404, "User not found."),
  ],
  [
    "PATCH",
    "/users/:id/role",
    ["ADMIN"],
    ({ p, body, me }) => {
      const x = userById(p[0]) ?? fail(404, "User not found.");
      if (!staff.concat("STUDENT").includes(body.role))
        fail(422, "Invalid role.", { role: "Invalid role" });
      if (x.id === me.id) fail(400, "You cannot change your own role.");
      x.role = body.role;
      return pubUser(x);
    },
  ],
  [
    "PATCH",
    "/users/:id/activate",
    ["ADMIN"],
    ({ p }) => {
      const x = userById(p[0]) ?? fail(404, "User not found.");
      x.isActive = true;
      return pubUser(x);
    },
  ],
  [
    "PATCH",
    "/users/:id/deactivate",
    ["ADMIN"],
    ({ p, me }) => {
      const x = userById(p[0]) ?? fail(404, "User not found.");
      if (x.id === me.id) fail(400, "You cannot deactivate your own account.");
      x.isActive = false;
      return pubUser(x);
    },
  ],
  [
    "GET",
    "/events",
    "any",
    ({ me, query }) => {
      let list = getDb().events;
      if (!staff.includes(me.role)) list = list.filter((e) => e.status !== "DRAFT");
      if (query.status) list = list.filter((e) => e.status === query.status);
      return [...list].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    },
  ],
  [
    "GET",
    "/events/:id",
    "any",
    ({ p, me }) => {
      const e = eventById(p[0]);
      if (!e || (e.status === "DRAFT" && !staff.includes(me.role))) fail(404, "Event not found.");
      return e;
    },
  ],
  [
    "POST",
    "/events",
    staff,
    ({ body }) => {
      const e = {
        id: nextId(),
        ...body,
        volunteerLimit: body.needsVolunteers ? body.volunteerLimit : null,
      };
      getDb().events.push(e);
      return e;
    },
  ],
  [
    "PATCH",
    "/events/:id",
    staff,
    ({ p, body }) => {
      const e = eventById(p[0]) ?? fail(404, "Event not found.");
      Object.assign(e, body);
      if (!e.needsVolunteers) e.volunteerLimit = null;
      return e;
    },
  ],
  [
    "POST",
    "/events/:id/tickets",
    ["STUDENT"],
    ({ p, me }) => {
      const e = eventById(p[0]) ?? fail(404, "Event not found.");
      if (!isUpcoming(e)) fail(400, "Registration is closed for this event.");
      if (
        getDb().tickets.some(
          (t) => t.eventId === e.id && t.userId === me.id && t.status !== "CANCELLED",
        )
      )
        fail(409, "You are already registered for this event.");
      const code =
        e.title
          .replace(/[^A-Z]/g, "")
          .slice(0, 3)
          .padEnd(3, "X") +
        "-" +
        Math.random().toString(36).slice(2, 8).toUpperCase();
      const t = {
        id: nextId(),
        ticketCode: code,
        eventId: e.id,
        userId: me.id,
        status: "ACTIVE",
        createdAt: now(),
      };
      getDb().tickets.push(t);
      return ticketOut(t);
    },
  ],
  [
    "GET",
    "/tickets/me",
    "any",
    ({ me }) =>
      getDb()
        .tickets.filter((t) => t.userId === me.id)
        .map(ticketOut),
  ],
  [
    "POST",
    "/events/:id/volunteer-applications",
    ["STUDENT"],
    ({ p, me }) => {
      const e = eventById(p[0]) ?? fail(404, "Event not found.");
      if (!e.needsVolunteers) fail(400, "This event does not need volunteers.");
      if (
        getDb().applications.some(
          (a) => a.eventId === e.id && a.userId === me.id && a.status !== "CANCELLED",
        )
      )
        fail(409, "You have already applied to volunteer for this event.");
      const a = {
        id: nextId(),
        eventId: e.id,
        userId: me.id,
        status: "PENDING",
        appliedAt: now(),
        reviewedAt: null,
      };
      getDb().applications.push(a);
      return appOut(a);
    },
  ],
  [
    "GET",
    "/volunteer-applications/me",
    "any",
    ({ me }) =>
      getDb()
        .applications.filter((a) => a.userId === me.id)
        .map(appOut),
  ],
  [
    "GET",
    "/events/:id/volunteer-applications",
    staff,
    ({ p }) =>
      getDb()
        .applications.filter((a) => a.eventId === p[0])
        .map(appOut),
  ],
  [
    "PATCH",
    "/volunteer-applications/:id/approve",
    staff,
    ({ p }) => {
      const a =
        getDb().applications.find((x) => x.id === p[0]) ?? fail(404, "Application not found.");
      const e = eventById(a.eventId);
      const approved = getDb().applications.filter(
        (x) => x.eventId === a.eventId && x.status === "APPROVED",
      ).length;
      if (e?.volunteerLimit && approved >= e.volunteerLimit)
        fail(409, "Volunteer limit reached for this event.");
      a.status = "APPROVED";
      a.reviewedAt = now();
      return appOut(a);
    },
  ],
  [
    "PATCH",
    "/volunteer-applications/:id/reject",
    staff,
    ({ p }) => {
      const a =
        getDb().applications.find((x) => x.id === p[0]) ?? fail(404, "Application not found.");
      a.status = "REJECTED";
      a.reviewedAt = now();
      return appOut(a);
    },
  ],
  [
    "POST",
    "/events/:id/tasks",
    staff,
    ({ p, body }) => {
      const ok = getDb().applications.some(
        (a) => a.eventId === p[0] && a.userId === body.volunteerId && a.status === "APPROVED",
      );
      if (!ok) fail(400, "Tasks can only be assigned to approved volunteers of this event.");
      const t = { id: nextId(), eventId: p[0], ...body, status: "ASSIGNED" };
      getDb().tasks.push(t);
      return taskOut(t);
    },
  ],
  [
    "GET",
    "/events/:id/tasks",
    staff,
    ({ p }) =>
      getDb()
        .tasks.filter((t) => t.eventId === p[0])
        .map(taskOut),
  ],
  [
    "GET",
    "/tasks/me",
    "any",
    ({ me }) =>
      getDb()
        .tasks.filter((t) => t.volunteerId === me.id)
        .map(taskOut),
  ],
  [
    "PATCH",
    "/tasks/:id/status",
    "any",
    ({ p, me, body }) => {
      const t = getDb().tasks.find((x) => x.id === p[0]) ?? fail(404, "Task not found.");
      if (t.volunteerId !== me.id) fail(403, "Only the assigned volunteer can update this task.");
      t.status = body.status;
      return taskOut(t);
    },
  ],
  [
    "PATCH",
    "/tasks/:id/reassign",
    staff,
    ({ p, body }) => {
      const t = getDb().tasks.find((x) => x.id === p[0]) ?? fail(404, "Task not found.");
      const ok = getDb().applications.some(
        (a) => a.eventId === t.eventId && a.userId === body.volunteerId && a.status === "APPROVED",
      );
      if (!ok) fail(400, "The new volunteer must be approved for this event.");
      t.volunteerId = body.volunteerId;
      t.status = "ASSIGNED";
      return taskOut(t);
    },
  ],
  [
    "GET",
    "/events/:id/scanner/access",
    "any",
    ({ p, me }) => {
      const ok =
        getDb().tasks.some(
          (t) => t.eventId === p[0] && t.volunteerId === me.id && t.taskType === "QR_SCANNER",
        ) &&
        getDb().applications.some(
          (a) => a.eventId === p[0] && a.userId === me.id && a.status === "APPROVED",
        );
      if (!ok) fail(403, "You are not authorized to scan tickets for this event.");
      return { allowed: true, event: lite(eventById(p[0])) };
    },
  ],
  [
    "POST",
    "/events/:id/checkins",
    "any",
    ({ p, me, body }) => {
      const ok = getDb().tasks.some(
        (t) => t.eventId === p[0] && t.volunteerId === me.id && t.taskType === "QR_SCANNER",
      );
      if (!ok) fail(403, "Unauthorized scanner.");
      const code = String(body?.ticketCode || "")
        .trim()
        .toUpperCase();
      const t = getDb().tickets.find((x) => x.ticketCode === code) ?? fail(404, "Invalid ticket.");
      if (t.eventId !== p[0]) fail(400, "This ticket belongs to a different event.");
      if (t.status === "CANCELLED") fail(400, "This ticket has been cancelled.");
      if (getDb().checkins.some((c) => c.ticketId === t.id))
        fail(409, "Ticket already checked in.");
      const c = {
        id: nextId(),
        ticketId: t.id,
        eventId: p[0],
        scannedById: me.id,
        scannedAt: now(),
      };
      getDb().checkins.push(c);
      return {
        ...checkinOut(c),
        attendeeName: userById(t.userId)?.fullName,
        eventTitle: eventById(p[0])?.title,
        ticketId: t.id,
        ticketCode: t.ticketCode,
      };
    },
  ],
  [
    "GET",
    "/events/:id/attendance",
    staff,
    ({ p }) =>
      getDb()
        .checkins.filter((c) => c.eventId === p[0])
        .map(checkinOut),
  ],
  ["GET", "/events/:id/attendance/count", staff, ({ p }) => count(p[0])],
  [
    "GET",
    "/memberships/me",
    "any",
    ({ me }) => {
      const m = getDb().memberships.find((x) => x.userId === me.id);
      return m ? memOut(m) : fail(404, "No membership found.");
    },
  ],
  ["GET", "/memberships", ["ADMIN"], () => getDb().memberships.map(memOut)],
  [
    "POST",
    "/memberships",
    ["ADMIN"],
    ({ body }) => {
      if (!userById(body.userId)) fail(422, "User not found.", { userId: "Select a valid user" });
      const m = { id: nextId(), ...body };
      getDb().memberships.push(m);
      return memOut(m);
    },
  ],
  [
    "PATCH",
    "/memberships/:id",
    ["ADMIN"],
    ({ p, body }) => {
      const m =
        getDb().memberships.find((x) => x.id === p[0]) ?? fail(404, "Membership not found.");
      Object.assign(m, body);
      return memOut(m);
    },
  ],
  [
    "GET",
    "/merchandise",
    "any",
    ({ me }) =>
      me.role === "ADMIN" ? getDb().products : getDb().products.filter((x) => x.isActive),
  ],
  [
    "POST",
    "/merchandise",
    ["ADMIN"],
    ({ body }) => {
      const x = { id: nextId(), isActive: true, ...body };
      getDb().products.push(x);
      return x;
    },
  ],
  [
    "PATCH",
    "/merchandise/:id",
    ["ADMIN"],
    ({ p, body }) => {
      const x = getDb().products.find((y) => y.id === p[0]) ?? fail(404, "Product not found.");
      Object.assign(x, body);
      return x;
    },
  ],
  [
    "PATCH",
    "/merchandise/:id/activate",
    ["ADMIN"],
    ({ p }) => {
      const x = getDb().products.find((y) => y.id === p[0]) ?? fail(404, "Product not found.");
      x.isActive = true;
      return x;
    },
  ],
  [
    "PATCH",
    "/merchandise/:id/deactivate",
    ["ADMIN"],
    ({ p }) => {
      const x = getDb().products.find((y) => y.id === p[0]) ?? fail(404, "Product not found.");
      x.isActive = false;
      return x;
    },
  ],
  [
    "POST",
    "/orders",
    ["STUDENT"],
    ({ body, me }) => {
      const x =
        getDb().products.find((y) => y.id === body.productId && y.isActive) ??
        fail(404, "Product not available.");
      const q = Number(body.quantity);
      if (!q || q < 1)
        fail(422, "Quantity must be at least 1.", { quantity: "Must be at least 1" });
      if (q > x.stock) fail(409, `Only ${x.stock} left in stock.`);
      x.stock -= q;
      const o = {
        id: nextId(),
        productId: x.id,
        userId: me.id,
        quantity: q,
        status: "PLACED",
        createdAt: now(),
      };
      getDb().orders.push(o);
      return orderOut(o);
    },
  ],
  [
    "GET",
    "/orders/me",
    "any",
    ({ me }) =>
      getDb()
        .orders.filter((o) => o.userId === me.id)
        .map(orderOut),
  ],
  ["GET", "/orders", ["ADMIN"], () => getDb().orders.map(orderOut)],
  [
    "GET",
    "/announcements",
    "any",
    ({ me }) =>
      getDb()
        .announcements.filter((a) => a.isPublished || staff.includes(me.role))
        .map(annOut)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  ],
  [
    "POST",
    "/announcements",
    staff,
    ({ body, me }) => {
      const a = {
        id: nextId(),
        ...body,
        publishedAt: body.isPublished ? now() : null,
        createdById: me.id,
        createdAt: now(),
      };
      getDb().announcements.push(a);
      return annOut(a);
    },
  ],
  [
    "PATCH",
    "/announcements/:id",
    staff,
    ({ p, body }) => {
      const a =
        getDb().announcements.find((x) => x.id === p[0]) ?? fail(404, "Announcement not found.");
      if (body.isPublished && !a.isPublished) a.publishedAt = now();
      Object.assign(a, body);
      return annOut(a);
    },
  ],
  [
    "DELETE",
    "/announcements/:id",
    ["ADMIN"],
    ({ p }) => {
      const d = getDb();
      d.announcements = d.announcements.filter((x) => x.id !== p[0]);
      return { success: true };
    },
  ],
  [
    "GET",
    "/dashboard/admin",
    ["ADMIN"],
    () => {
      const d = getDb();
      const upcoming = d.events.filter(isUpcoming);
      return {
        totalUsers: d.users.length,
        students: d.users.filter((x) => x.role === "STUDENT").length,
        studentLeaders: d.users.filter((x) => x.role === "STUDENT_LEADER").length,
        admins: d.users.filter((x) => x.role === "ADMIN").length,
        activeUsers: d.users.filter((x) => x.isActive).length,
        inactiveUsers: d.users.filter((x) => !x.isActive).length,
        upcomingEvents: upcoming.length,
        volunteerApplications: d.applications.length,
        approvedVolunteers: d.applications.filter((a) => a.status === "APPROVED").length,
        attendance: d.checkins.length,
        merchandiseStock: d.products.reduce((s, x) => s + x.stock, 0),
        orders: d.orders.length,
        announcements: d.announcements.length,
        upcomingEventsList: upcoming.slice(0, 5),
        volunteerOverview: ["PENDING", "APPROVED", "REJECTED"].map((s) => ({
          status: s,
          count: d.applications.filter((a) => a.status === s).length,
        })),
        attendanceOverview: upcoming.map((e) => ({
          eventId: e.id,
          title: e.title,
          ...count(e.id),
        })),
        merchandiseOverview: d.products.map((x) => ({
          id: x.id,
          name: `${x.name} (${x.size})`,
          stock: x.stock,
        })),
      };
    },
  ],
  [
    "GET",
    "/dashboard/student-leader",
    staff,
    () => {
      const d = getDb();
      const upcoming = d.events.filter(isUpcoming);
      return {
        upcomingEvents: upcoming.slice(0, 5),
        pendingVolunteerApplications: d.applications.filter((a) => a.status === "PENDING").length,
        approvedVolunteers: d.applications.filter((a) => a.status === "APPROVED").length,
        volunteerTasks: d.tasks.length,
        attendanceCount: d.checkins.length,
        activeQrScanners: d.tasks.filter(
          (t) => t.taskType === "QR_SCANNER" && t.status !== "COMPLETED",
        ).length,
        recentAnnouncements: d.announcements
          .filter((a) => a.isPublished)
          .slice(-3)
          .reverse()
          .map(annOut),
      };
    },
  ],
  [
    "GET",
    "/dashboard/student",
    ["STUDENT"],
    ({ me }) => {
      const d = getDb();
      return {
        upcomingEvents: d.events.filter(isUpcoming).slice(0, 4),
        tickets: d.tickets.filter((t) => t.userId === me.id).map(ticketOut),
        volunteerApplications: d.applications.filter((a) => a.userId === me.id).map(appOut),
        tasks: d.tasks.filter((t) => t.volunteerId === me.id).map(taskOut),
        orders: d.orders.filter((o) => o.userId === me.id).map(orderOut),
        recentAnnouncements: d.announcements
          .filter((a) => a.isPublished)
          .slice(-3)
          .reverse()
          .map(annOut),
      };
    },
  ],
];
function match(pattern, path) {
  const a = pattern.split("/"),
    b = path.split("/");
  if (a.length !== b.length) return null;
  const params = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params.push(decodeURIComponent(b[i]));
    else if (a[i] !== b[i]) return null;
  }
  return params;
}
export async function mockRequest(method, path, opts) {
  await new Promise((r) => setTimeout(r, 250));
  for (const [m, pattern, access, handler] of routes) {
    if (m !== method) continue;
    const p = match(pattern, path);
    if (!p) continue;
    let me = null;
    if (access !== "public") {
      const id = opts.token?.startsWith("mock-token-") ? opts.token.slice(11) : null;
      me = id ? userById(id) : null;
      if (!me || !me.isActive) fail(401, "Your session has expired. Please sign in again.");
      if (Array.isArray(access) && !access.includes(me.role))
        fail(403, "You do not have permission to perform this action.");
    }
    const result = handler({ me, body: opts.body ?? {}, query: opts.query ?? {}, p });
    save();
    return JSON.parse(JSON.stringify(result ?? null));
  }
  fail(404, `No mock handler for ${method} ${path}`);
}
