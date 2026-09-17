"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * STATUS: NOT VERIFIED against a live Supabase project (none provisioned in this
 * environment — see docs/HANDOFF.md IMPLEMENTATION STATUS). Written to match
 * lib/supabase-client.ts (the server-side counterpart) and lib/auth-context.ts exactly.
 * Requires NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime.
 */
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
