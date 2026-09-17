"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AuthContext } from "@sih/types";
import type { PermissionKey } from "@sih/config";
import { getSupabaseBrowserClient } from "../supabase-browser";
import { meApi } from "../api/me";
import { ApiRequestError } from "../api/client";

interface SessionState {
  loading: boolean;
  authContext: AuthContext | null;
  userEmail: string | null;
  error: string | null;
  hasPermission: (key: PermissionKey) => boolean;
  primaryRole: string | null;
  activeMineId: string | null;
  setActiveMineId: (mineId: string | null) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = React.createContext<SessionState | null>(null);

/**
 * STATUS: written against the documented contract (Supabase session -> GET /api/me ->
 * AuthContext) but NOT VERIFIED against a live Supabase project — see docs/C2_ANALYSIS.md
 * and docs/HANDOFF.md. The shape/flow is correct for when a real project is provisioned.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [authContext, setAuthContext] = React.useState<AuthContext | null>(null);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeMineId, setActiveMineId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthContext(null);
        setUserEmail(null);
        router.replace("/login");
        return;
      }
      setUserEmail(session.user.email ?? null);
      const { data } = await meApi.get();
      setAuthContext(data);
      const firstScopedRole = data.roles.find((r) => r.mineId !== null);
      setActiveMineId((prev) => prev ?? firstScopedRole?.mineId ?? null);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        router.replace("/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to resolve session.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    load();
  }, [load]);

  const signOut = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setAuthContext(null);
    router.replace("/login");
  }, [router]);

  const hasPermission = React.useCallback(
    (key: PermissionKey) => authContext?.permissions.includes(key) ?? false,
    [authContext]
  );

  const primaryRole = authContext?.roles[0]?.roleKey ?? null;

  const value: SessionState = {
    loading,
    authContext,
    userEmail,
    error,
    hasPermission,
    primaryRole,
    activeMineId,
    setActiveMineId,
    signOut,
    refresh: load,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
