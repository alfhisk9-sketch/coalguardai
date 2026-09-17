import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isConfigured } from "./supabase";

interface AuthState {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = React.createContext<AuthState | null>(null);

/**
 * STATUS: NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION.
 * Session persistence is delegated to the SecureStore adapter in supabase.ts, so a
 * signed-in inspector stays signed in across app restarts and in the field offline.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const configured = isConfigured();

  React.useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const signIn = React.useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = React.useMemo<AuthState>(
    () => ({ session, loading, configured, signIn, signOut }),
    [session, loading, configured, signIn, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const value = React.useContext(Ctx);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}
