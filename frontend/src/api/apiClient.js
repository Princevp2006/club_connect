// Centralized REST client. All feature API modules go through `request`.
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "";
export const USE_MOCK_API = import.meta.env["VITE_USE_MOCK_API"] === "true";
const TOKEN_KEY = "som.auth.token";
export const tokenStore = {
  get() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
  },
};
export class ApiError extends Error {
  status;
  errors;
  traceId;
  constructor(status, message, errors, traceId) {
    super(message);
    this.status = status;
    this.errors = errors ?? {};
    this.traceId = traceId;
  }
}
export const UNAUTHORIZED_EVENT = "som:unauthorized";
function buildQuery(query) {
  if (!query) return "";
  const p = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}
function handleFailure(err, auth) {
  if (err.status === 401 && auth) {
    tokenStore.clear();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  throw err;
}
export async function request(method, path, opts = {}) {
  const { body, query, auth = true } = opts;
  const token = auth ? tokenStore.get() : null;
  if (USE_MOCK_API) {
    const { mockRequest } = await import("./mock/mockServer");
    try {
      return await mockRequest(method, path, { body, query: query ?? {}, token });
    } catch (e) {
      if (e instanceof ApiError) handleFailure(e, auth);
      throw e;
    }
  }
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : null,
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Check your connection and try again.");
  }
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!res.ok) {
    handleFailure(
      new ApiError(
        res.status,
        json?.message || defaultMessage(res.status),
        json?.errors,
        json?.traceId,
      ),
      auth,
    );
  }
  return json && typeof json === "object" && "data" in json ? json.data : json;
}
export function defaultMessage(status) {
  switch (status) {
    case 400:
      return "The request was invalid.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This conflicts with an existing record.";
    case 422:
      return "Please correct the highlighted fields.";
    default:
      return "Something went wrong on the server. Please try again later.";
  }
}
export function getErrorMessage(e) {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Unexpected error";
}
/** Normalizes list responses: plain arrays or { items|data|results, total }. */
export function asList(data) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  const items = data?.items ?? data?.data ?? data?.results ?? data?.rows ?? [];
  const total = data?.total ?? data?.pagination?.total ?? data?.meta?.total ?? items.length;
  return { items, total };
}
export const api = {
  get: (p, query) => request("GET", p, { query }),
  post: (p, body, auth = true) => request("POST", p, { body, auth }),
  patch: (p, body) => request("PATCH", p, { body }),
  del: (p) => request("DELETE", p),
};
