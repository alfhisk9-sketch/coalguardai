"use client";

import * as React from "react";
import type { AuthContext as AuthContextDto } from "@sih/types";
import type { PermissionKey, RoleKey } from "@sih/config";
import { meApi } from "../api/me";
import { ApiRequestError } from "../api/client";
import { DEMO_MODE, DEMO_ROLE_STORAGE_KEY, buildDemoAuthContext } from "./demo";

interface AuthState {
  ctx: AuthContextDto | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  primaryRole: RoleKey | null;
  can: (permission: PermissionKey) => boolean;
  setDemoRole: (role: RoleKey) => void;
  reload: () => void;
}

const AuthCtx = React.createContext<AuthState | null>(null);

/** Most-privileged role first — decides which dashboard a multi-role user lands on. */
const ROLE_PRIORITY: RoleKey[] = ["SUPER_ADMIN", "CORPORATE_ADMIN", "MINE_MANAGER", "REGULATOR", "INSPECTOR", "CONTRACTOR"];

function resolvePrimaryRole(ctx: AuthContextDto | null): RoleKey | null {
  if (!ctx) return null;
  const held = new Set(ctx.roles.map((r) => r.roleKey));
  return ROLE_PRIORITY.find((r) => held.has(r)) ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = React.useState<AuthContextDto | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDemo, setIsDemo] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  const applyDemoRole = React.useCallback((role: RoleKey) => {
    window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
    setCtx(buildDemoAuthContext(role));
    setIsDemo(true);
    setError(null);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    meApi
      .get()
      .then((res) => {
        if (cancelled) return;
        setCtx(res.data);
        setIsDemo(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // No live session. In demo mode fall back to a local demo context so the
        // app is demonstrable; otherwise surface the real error to the login flow.
        if (DEMO_MODE) {
          const stored = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) as RoleKey | null;
          applyDemoRole(stored ?? "CORPORATE_ADMIN");
          return;
        }
        setCtx(null);
        setError(err instanceof ApiRequestError ? err.message : "Unable to load your session.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tick, applyDemoRole]);

  const value = React.useMemo<AuthState>(
    () => ({
      ctx,
      loading,
      error,
      isDemo,
      primaryRole: resolvePrimaryRole(ctx),
      can: (permission) => ctx?.permissions.includes(permission) ?? false,
      setDemoRole: applyDemoRole,
      reload: () => setTick((t) => t + 1),
    }),
    [ctx, loading, error, isDemo, applyDemoRole]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const value = React.useContext(AuthCtx);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}
