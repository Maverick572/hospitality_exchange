import { getIdToken } from "@/lib/auth";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;
  /** The backend has no such route yet (FastAPI's bare "Not Found"). */
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

/**
 * The backend answers in three shapes: the documented envelope
 * `{ success: false, error: { code, message } }`, FastAPI's
 * `{ detail: "..." }` (or a validation array), and the parser's
 * `{ success: false, error: "..." }`. Normalise them to one message.
 */
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

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

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
    // A CORS rejection surfaces as the same network error as a dead server,
    // and the backend only allows pages served from port 5173.
    const port = typeof window !== "undefined" ? window.location.port : "";
    throw new ApiError(
      port && port !== "5173"
        ? `The API blocked this page because it's served from port ${port}. The backend only accepts port 5173, so run \`npm run dev\` and open http://localhost:5173.`
        : `Can't reach the API at ${API_BASE_URL}. Is the backend running?`,
      0,
    );
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
    const { message, code } = errorMessage(json, `Request failed (${response.status}).`);
    const notImplemented =
      (response.status === 404 && message === "Not Found") || response.status === 405;
    throw new ApiError(
      notImplemented ? `The backend doesn't have ${method} ${path} yet.` : message,
      response.status,
      { code, notImplemented },
    );
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
