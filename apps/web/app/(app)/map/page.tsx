"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Mine } from "@sih/types";
import { minesApi } from "../../../lib/api/mines";
import { incidentsApi } from "../../../lib/api/incidents";
import { useAsync } from "../../../lib/hooks/use-async";
import { PageHeader } from "../../../components/common/page-header";
import type { MapPoint } from "../../../components/common/mine-map";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

// Leaflet touches `window` at import time, so the map is client-only.
const MineMap = dynamic(() => import("../../../components/common/mine-map"), {
  ssr: false,
  loading: () => <LoadingState label="Loading map…" />,
});

type Filter = "ALL" | "MINES" | "INCIDENTS";

export default function MapPage() {
  const [filter, setFilter] = React.useState<Filter>("ALL");

  const { data, loading, error, reload } = useAsync(async () => {
    const mines = (await minesApi.list()).data;
    const incidentLists = await Promise.all(
      mines.map(async (m: Mine) => {
        try {
          return (await incidentsApi.list(m.id)).data;
        } catch {
          return [];
        }
      })
    );
    return { mines, incidents: incidentLists.flat() };
  }, []);

  const points: MapPoint[] = React.useMemo(() => {
    if (!data) return [];
    const minePoints: MapPoint[] = data.mines
      .filter((m) => m.latitude !== null && m.longitude !== null)
      .map((m) => ({
        id: m.id,
        name: m.name,
        latitude: m.latitude as number,
        longitude: m.longitude as number,
        kind: "MINE",
        detail: `${m.code} · ${m.mineType.replace("_", " ")}`,
      }));
    const incidentPoints: MapPoint[] = data.incidents
      .filter((i) => i.latitude !== null && i.longitude !== null)
      .map((i) => ({
        id: i.id,
        name: i.description.slice(0, 60),
        latitude: i.latitude as number,
        longitude: i.longitude as number,
        kind: "INCIDENT",
        detail: `${i.severity} · ${i.status.replace(/_/g, " ")}`,
      }));
    if (filter === "MINES") return minePoints;
    if (filter === "INCIDENTS") return incidentPoints;
    return [...minePoints, ...incidentPoints];
  }, [data, filter]);

  return (
    <>
      <PageHeader title="Geographic view" description="Mine locations and geotagged field records on an OpenStreetMap base layer." />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          {(["ALL", "MINES", "INCIDENTS"] as Filter[]).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "ALL" ? "All" : f === "MINES" ? "Mines" : "Incidents"}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">{points.length} mapped</span>
        </CardContent>
      </Card>

      {loading ? (
        <LoadingState label="Loading map data…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : points.length === 0 ? (
        <EmptyState title="Nothing to map" description="No records in scope have recorded coordinates." />
      ) : (
        <MineMap points={points} />
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Coordinates shown are those stored on each record. Demo records carry fictional coordinates.
      </p>
    </>
  );
}
