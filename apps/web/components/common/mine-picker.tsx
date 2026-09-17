"use client";

import * as React from "react";
import type { Mine } from "@sih/types";
import { minesApi } from "../../lib/api/mines";
import { useAsync } from "../../lib/hooks/use-async";
import { Select } from "../ui/select";

/**
 * Most C1 list endpoints are mine-scoped (`?mineId=`), so mine-scoped pages need a
 * consistent picker. Selection is lifted to the parent page so the page owns the query.
 */
export function MinePicker({ value, onChange }: { value: string | null; onChange: (mineId: string) => void }) {
  const { data } = useAsync(async () => (await minesApi.list()).data, []);
  const mines = React.useMemo<Mine[]>(() => data ?? [], [data]);

  React.useEffect(() => {
    const first = mines[0];
    if (!value && first) onChange(first.id);
  }, [mines, value, onChange]);

  return (
    <Select aria-label="Select mine" className="w-56" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {mines.length === 0 ? <option value="">No mines available</option> : null}
      {mines.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </Select>
  );
}
