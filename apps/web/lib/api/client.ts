import type { ApiError, ApiSuccess } from "@sih/types";

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(status: number, err: ApiError["error"]) {
    super(err.message);
    this.code = err.code;
    this.status = status;
    this.details = err.details;
  }
}

/**
 * Thin fetch wrapper around the C1 route handlers. Matches API.md's response envelope
 * exactly ({ data, meta } / { error }) and throws ApiRequestError so callers can branch
 * on `.status`/`.code` instead of re-parsing the envelope everywhere.
 */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "include",
  });
  const body = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;
  if (!res.ok || !body || "error" in body) {
    const err = body && "error" in body ? body.error : { code: "UNKNOWN", message: `Request failed (${res.status}).` };
    throw new ApiRequestError(res.status, err);
  }
  return body;
}

export function apiGet<T>(path: string): Promise<ApiSuccess<T>> {
  return apiRequest<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown): Promise<ApiSuccess<T>> {
  return apiRequest<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPatch<T>(path: string, body: unknown): Promise<ApiSuccess<T>> {
  return apiRequest<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}
