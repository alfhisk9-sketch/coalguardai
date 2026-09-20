"use client";

import * as React from "react";
import type { AuthContext as AuthContextDto } from "@sih/types";
import type { PermissionKey, RoleKey } from "@sih/config";
import { meApi } from "../api/me";
import { ApiRequestError } from "../api/client";
import { getSupabaseBrowserClient } from "../supabase-browser";
import { DEMO_MODE, DEMO_ROLE_STORAGE_KEY, NAMED_DEMO_ACCOUNTS, buildDemoAuthContext } from "./demo";

interface AuthState {
  ctx: AuthContextDto | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  primaryRole: RoleKey | null;
  can: (permission: PermissionKey) => boolean;
  enterDemoWorkspace: (role: RoleKey) => Promise<boolean>;
  setDemoRole: (role: RoleKey) => void;
  signOut: () => Promise<void>;
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

  const fetchSession = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await meApi.get();
      setCtx(res.data);
      const isDemoAccount = res.data.userEmail?.includes(".demo@sih26024.test") ?? false;
      setIsDemo(isDemoAccount);
      setError(null);
    } catch (err) {
      if (DEMO_MODE) {
        const stored = typeof window !== "undefined" ? (window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY) as RoleKey | null) : null;
        if (stored) {
          setCtx(buildDemoAuthContext(stored));
          setIsDemo(true);
          setError(null);
          return;
        }
      }
      setCtx(null);
      setIsDemo(false);
      setError(err instanceof ApiRequestError ? err.message : "Unable to load your session.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSession();

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await fetchSession();
      } else if (event === "SIGNED_OUT") {
        setCtx(null);
        setIsDemo(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [tick, fetchSession]);

  const enterDemoWorkspace = React.useCallback(async (role: RoleKey): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const persona = NAMED_DEMO_ACCOUNTS[role];
      if (persona) {
        const supabase = getSupabaseBrowserClient();
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: persona.email,
          password: "demo123"
        });

        if (!signInErr) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
          }
          await fetchSession();
          return true;
        }
      }

      // Offline / fallback demo context if remote signIn is unavailable
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
      }
      setCtx(buildDemoAuthContext(role));
      setIsDemo(true);
      return true;
    } catch {
      setCtx(buildDemoAuthContext(role));
      setIsDemo(true);
      return true;
    } finally {
      setLoading(false);
    }
  }, [fetchSession]);

  const applyDemoRole = React.useCallback((role: RoleKey) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
    }
    setCtx(buildDemoAuthContext(role));
    setIsDemo(true);
    setError(null);
  }, []);

  const handleSignOut = React.useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    }
    setCtx(null);
    setIsDemo(false);
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({
      ctx,
      loading,
      error,
      isDemo,
      primaryRole: resolvePrimaryRole(ctx),
      can: (permission) => ctx?.permissions.includes(permission) ?? false,
      enterDemoWorkspace,
      setDemoRole: applyDemoRole,
      signOut: handleSignOut,
      reload: () => setTick((t) => t + 1),
    }),
    [ctx, loading, error, isDemo, enterDemoWorkspace, applyDemoRole, handleSignOut]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const value = React.useContext(AuthCtx);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}

