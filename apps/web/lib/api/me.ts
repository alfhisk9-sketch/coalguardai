import type { AuthContext } from "@sih/types";
import { apiGet } from "./client";

export const meApi = {
  get: () => apiGet<AuthContext>("/api/me"),
};
