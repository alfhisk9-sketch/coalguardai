"use client";

import { MapPin, MapPinOff } from "lucide-react";
import type { GeoState } from "../../lib/hooks/use-geolocation";
import { Button } from "../ui/button";

export function GpsIndicator({ geo, onCapture }: { geo: GeoState; onCapture: () => void }) {
  const available = geo.status === "available";
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
      <div className="flex min-w-0 items-center gap-2">
        {available ? (
          <MapPin className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
        ) : (
          <MapPinOff className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium">
            {available ? "Location captured" : geo.status === "requesting" ? "Acquiring location…" : "Location not captured"}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {available
              ? `${geo.latitude?.toFixed(5)}, ${geo.longitude?.toFixed(5)}${geo.accuracy ? ` · ±${Math.round(geo.accuracy)} m` : ""}`
              : (geo.message ?? "Coordinates are optional but recommended for field records.")}
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onCapture} disabled={geo.status === "requesting"}>
        {available ? "Recapture" : "Capture GPS"}
      </Button>
    </div>
  );
}
