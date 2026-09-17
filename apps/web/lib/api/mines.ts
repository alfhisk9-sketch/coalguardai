import type { Mine } from "@sih/types";
import type { MineCreateInput } from "@sih/validation";
import { apiGet, apiPost } from "./client";

export const minesApi = {
  list: () => apiGet<Mine[]>("/api/mines"),
  create: (input: MineCreateInput) => apiPost<Mine>("/api/mines", input),
};
