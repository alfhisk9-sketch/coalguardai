import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

export function getSupabaseServerClient() {
  const cookieStore = cookies();
  let authHeader: string | null = null;
  try {
    authHeader = headers().get("authorization");
  } catch {
    // headers() might not be available in non-request contexts
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { get: (name: string) => cookieStore.get(name)?.value },
      ...(authHeader ? { global: { headers: { Authorization: authHeader } } } : {})
    }
  );
}

