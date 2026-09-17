import { API_BASE_URL, supabase } from "./supabase";

export class MobileApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Mobile authenticates with a bearer token (API.md), unlike the web app's session
 * cookie. Everything else — routes, payload shapes, response envelope — is identical,
 * so no mobile-specific backend surface exists.
 */
async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { ...(await authHeader()) } });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || "error" in body) {
    const err = body?.error ?? { code: "UNKNOWN", message: `Request failed (${res.status}).` };
    throw new MobileApiError(res.status, err.code, err.message);
  }
  return body.data as T;
}

/**
 * Returns both the row and whether the server treated this as an idempotent replay
 * (200 = row already existed for this clientOperationId; 201 = newly created).
 * The queue treats both as success — that is the point of the idempotency contract.
 */
export async function apiPost<T>(path: string, payload: unknown): Promise<{ data: T; wasExisting: boolean }> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || "error" in body) {
    const err = body?.error ?? { code: "UNKNOWN", message: `Request failed (${res.status}).` };
    throw new MobileApiError(res.status, err.code, err.message);
  }
  return { data: body.data as T, wasExisting: res.status === 200 };
}
