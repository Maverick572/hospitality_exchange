import { getIdToken } from "@/lib/auth";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, opts?: { code?: string }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = opts?.code;
  }
}

type Json = Record<string, unknown> | unknown[] | null;

function errorMessage(body: Json, fallback: string): { message: string; code?: string } {
  if (!body || Array.isArray(body)) return { message: fallback };
  const error = (body as Record<string, unknown>).error;
  if (error && typeof error === "object" && "message" in error) {
    const e = error as { message?: string; code?: string };
    return { message: e.message ?? fallback, code: e.code };
  }
  if (typeof error === "string") return { message: error };
  const detail = (body as Record<string, unknown>).detail;
  if (typeof detail === "string") return { message: detail };
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { loc?: unknown[]; msg?: string };
    const field = first.loc?.filter((part) => part !== "body").join(".");
    return { message: field ? `${field}: ${first.msg}` : first.msg ?? fallback };
  }
  const message = (body as Record<string, unknown>).message;
  if (typeof message === "string") return { message };
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
  } catch (networkErr) {
    throw new ApiError(
      `Unable to connect to backend server at ${API_BASE_URL}. Make sure FastAPI is running.`,
      0
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

  const envelope = json && !Array.isArray(json) ? (json as Record<string, unknown>) : null;
  if (!response.ok || envelope?.success === false) {
    const { message, code } = errorMessage(json, `Request failed (${response.status}).`);
    throw new ApiError(message, response.status, { code });
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
