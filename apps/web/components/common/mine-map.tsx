"use client";

import * as React from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Mine } from "@sih/types";

/**
 * Plain lat/lng from the C1 contract — no PostGIS (GIS_SPEC.md).
 * Leaflet's default marker icons resolve to bundler-relative URLs that break under
 * Next's asset pipeline, so markers are drawn as divIcons instead.
 */
function markerIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

export interface MapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: "MINE" | "INCIDENT" | "INSPECTION";
  detail?: string;
}

const COLORS: Record<MapPoint["kind"], string> = {
  MINE: "hsl(217 91% 35%)",
  INCIDENT: "hsl(0 72% 45%)",
  INSPECTION: "hsl(199 89% 38%)",
};

export function MineMap({ points }: { points: MapPoint[] }) {
  const first = points[0];
  const center: [number, number] = first ? [first.latitude, first.longitude] : [21.25, 81.63];

  return (
    <div className="h-[28rem] w-full overflow-hidden rounded-lg border border-border">
      <MapContainer center={center} zoom={points.length > 1 ? 5 : 9} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={`${p.kind}-${p.id}`} position={[p.latitude, p.longitude]} icon={markerIcon(COLORS[p.kind])}>
            <Popup>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.kind}</p>
              {p.detail ? <p className="mt-1 text-xs">{p.detail}</p> : null}
              <p className="mt-1 font-mono text-[10px]">
                {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
              </p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default MineMap;
