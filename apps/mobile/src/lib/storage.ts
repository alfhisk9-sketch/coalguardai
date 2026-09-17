import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { QueuedOperation } from "./queue";

/**
 * Two stores, deliberately separated:
 *  - AsyncStorage for the operation queue (bulk data, not a credential).
 *  - SecureStore for the Supabase session (Keychain/Keystore-backed).
 * Auth tokens never touch AsyncStorage.
 */
const QUEUE_KEY = "minegov.queue.v1";
const SESSION_KEY = "minegov.session";

export async function loadQueue(): Promise<QueuedOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedOperation[]) : [];
  } catch {
    // A corrupt queue must not brick the app; start empty rather than crash on launch.
    return [];
  }
}

export async function saveQueue(ops: QueuedOperation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

export const sessionStore = {
  async get(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_KEY);
  },
  async set(value: string): Promise<void> {
    await SecureStore.setItemAsync(SESSION_KEY, value);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  },
};
