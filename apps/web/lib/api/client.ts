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

import { getSupabaseBrowserClient } from "../supabase-browser";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const customHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        customHeaders["Authorization"] = `Bearer ${session.access_token}`;
      }
    } catch {
      // Supabase client not initialized yet or in mock test environment
    }
  }

  const res = await fetch(path, {
    ...init,
    headers: { ...customHeaders, ...(init?.headers as Record<string, string> ?? {}) },
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
