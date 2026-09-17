import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

/**
 * STATUS: NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION.
 * No live Supabase project exists in this build environment, so sign-in has never been
 * executed. Written against the same auth contract the web app uses (docs/HANDOFF.md).
 *
 * Only the public anon key is used. The service-role key must never ship in a mobile
 * binary — it would be extractable from any installed device.
 */
const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isConfigured(): boolean {
  return SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "" && API_BASE_URL !== "";
}
