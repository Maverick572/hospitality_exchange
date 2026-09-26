import { getIdToken } from "@/lib/auth";
import { mockStore } from "@/lib/mock-store";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  notImplemented: boolean;

  constructor(message: string, status: number, opts?: { code?: string; notImplemented?: boolean }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts?.code;
    this.notImplemented = Boolean(opts?.notImplemented);
  }
}

type Json = Record<string, unknown> | unknown[] | null;

function errorMessage(body: Json, fallback: string): { message: string; code?: string } {
  if (!body || Array.isArray(body)) return { message: fallback };
  const error = body.error;
  if (error && typeof error === "object" && "message" in error) {
    const e = error as { message?: string; code?: string };
    return { message: e.message ?? fallback, code: e.code };
  }
  if (typeof error === "string") return { message: error };
  const detail = body.detail;
  if (typeof detail === "string") return { message: detail };
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const field = first.loc?.filter((part) => part !== "body").join(".");
    return { message: field ? `${field}: ${first.msg}` : first.msg ?? fallback };
  }
  if (typeof body.message === "string") return { message: body.message };
  return { message: fallback };
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;
};

function resolveMockFallback<T>(path: string, options: RequestOptions): T {
  const method = options.method ?? "GET";
  const b = (options.body ?? {}) as Record<string, unknown>;

  // Users
  if (path === "/users/me") return mockStore.getUser() as unknown as T;
  if (path === "/users/profile") return mockStore.updateUser(b as unknown as Parameters<typeof mockStore.updateUser>[0]) as unknown as T;

  // Categories
  if (path === "/categories") return { categories: mockStore.getCategories() } as unknown as T;

  // Resources
  if (path === "/resources/my") return mockStore.getResources() as unknown as T;
  if (path === "/resources" && method === "POST") return mockStore.createResource(b as unknown as Parameters<typeof mockStore.createResource>[0]) as unknown as T;
  if (path.startsWith("/resources/")) {
    const id = path.replace("/resources/", "");
    if (method === "GET") return mockStore.getResourceById(id) as unknown as T;
    if (method === "PATCH") return mockStore.updateResource(id, b as unknown as Parameters<typeof mockStore.updateResource>[1]) as unknown as T;
    if (method === "DELETE") return mockStore.deleteResource(id) as unknown as T;
  }

  // Requirements & Search
  if (path === "/seeker/search") return mockStore.search(b as unknown as Parameters<typeof mockStore.search>[0]) as unknown as T;
  if (path === "/requirements/my") return [] as unknown as T;
  if (path === "/requirements" && method === "POST") return { ...b, requirementId: `req_${Date.now()}` } as unknown as T;
  if (path === "/requirements/parse") {
    return {
      description: typeof b?.description === "string" ? b.description : "",
      items: [
        { name: "Banquet Chairs", category: "furniture", quantity: 100, metric: "units" },
        { name: "Round Tables", category: "furniture", quantity: 10, metric: "units" },
      ],
    } as unknown as T;
  }

  // Requests
  if (path === "/requests/provider") return mockStore.getRequests() as unknown as T;
  if (path === "/requests" && method === "POST") return mockStore.createRequest(b as unknown as Parameters<typeof mockStore.createRequest>[0]) as unknown as T;
  if (path.includes("/counter")) {
    const id = path.split("/")[2];
    mockStore.counterRequest(id, b as unknown as Parameters<typeof mockStore.counterRequest>[1]);
    return { success: true } as unknown as T;
  }
  if (path.includes("/accept")) {
    const id = path.split("/")[2];
    return mockStore.acceptRequest(id) as unknown as T;
  }
  if (path.includes("/reject")) {
    const id = path.split("/")[2];
    mockStore.rejectRequest(id, typeof b?.reason === "string" ? b.reason : undefined);
    return { success: true } as unknown as T;
  }

  // Bookings
  if (path === "/bookings/my") return mockStore.getBookings() as unknown as T;
  if (path.startsWith("/bookings/") && !path.includes("confirm-receipt")) {
    const id = path.replace("/bookings/", "");
    return mockStore.getBookingById(id) as unknown as T;
  }
  if (path.includes("/confirm-receipt")) {
    const id = path.split("/")[2];
    mockStore.confirmReceipt(id);
    return { success: true } as unknown as T;
  }

  // Escrow
  if (path.startsWith("/escrow/")) {
    const parts = path.split("/");
    const id = parts[2];
    if (parts[3] === "fund") return mockStore.fundEscrow(id, typeof b?.paymentReference === "string" ? b.paymentReference : "PAY_DEMO") as unknown as T;
    if (parts[3] === "release") return mockStore.releaseEscrow(id) as unknown as T;
    return mockStore.getEscrow(id) as unknown as T;
  }
  if (path === "/escrow" && method === "POST") {
    return mockStore.getEscrow(typeof b?.bookingId === "string" ? b.bookingId : "default") as unknown as T;
  }

  // Notifications
  if (path === "/notifications") return mockStore.getNotifications() as unknown as T;
  if (path.includes("/read")) {
    const id = path.split("/")[2];
    mockStore.markNotificationRead(id);
    return { success: true } as unknown as T;
  }

  // Dashboards
  if (path === "/dashboard/user") return mockStore.getUserDashboard() as unknown as T;
  if (path === "/dashboard/driver") return mockStore.getDriverDashboard() as unknown as T;

  // Drivers
  if (path === "/drivers/auth/status") {
    return { uid: mockStore.driver.driverId, hasDriverProfile: true, verificationStatus: "verified" } as unknown as T;
  }
  if (path === "/drivers/me") return mockStore.getDriver() as unknown as T;
  if (path === "/drivers/profile") return mockStore.getDriver() as unknown as T;
  if (path === "/driver-routes/my") return mockStore.getDriverRoutes() as unknown as T;
  if (path === "/driver-routes" && method === "POST") return mockStore.createDriverRoute(b as unknown as Parameters<typeof mockStore.createDriverRoute>[0]) as unknown as T;
  if (path.includes("/matches")) return mockStore.getDriverMatches() as unknown as T;
  if (path === "/logistics/match-routes") return mockStore.matchRoutes() as unknown as T;

  return [] as unknown as T;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  // If force demo is on, skip network call completely
  if (mockStore.forceDemo) {
    mockStore.isDemoMode = true;
    return resolveMockFallback<T>(path, options);
  }

  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = await getIdToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Graceful fallback on connection/CORS error
    mockStore.isDemoMode = true;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hrex_backend_status", { detail: { live: false } }));
    }
    return resolveMockFallback<T>(path, options);
  }

  let json: Json = null;
  const text = await response.text();
  if (text) {
    try {
      json = JSON.parse(text) as Json;
    } catch {
      json = null;
    }
  }

  const envelope = json && !Array.isArray(json) ? json : null;
  if (!response.ok || envelope?.success === false) {
    // If backend doesn't implement this endpoint yet (404/405/500), fall back gracefully
    if (response.status === 404 || response.status === 405 || response.status >= 500) {
      mockStore.isDemoMode = true;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hrex_backend_status", { detail: { live: false } }));
      }
      return resolveMockFallback<T>(path, options);
    }

    const { message, code } = errorMessage(json, `Request failed (${response.status}).`);
    throw new ApiError(message, response.status, { code, notImplemented: false });
  }

  // Live success
  mockStore.isDemoMode = false;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hrex_backend_status", { detail: { live: true } }));
  }

  if (envelope && "data" in envelope) return envelope.data as T;
  return json as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"]) => request<T>(path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body ?? {} }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body ?? {} }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
