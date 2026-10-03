export function fmtDate(v) {
  if (!v) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + "T00:00:00") : new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
export function fmtTime(v) {
  if (!v) return "—";
  if (/^\d{2}:\d{2}/.test(v)) {
    const [h, m] = v.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  const d = new Date(v);
  return isNaN(d.getTime())
    ? v
    : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
export function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
export const humanize = (s) =>
  s
    ? s
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "—";
export const initials = (name) =>
  (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
/** Accepts a number or an array and returns a count. */
export const countOf = (v) => (Array.isArray(v) ? v.length : typeof v === "number" ? v : 0);
