"use client";

import * as React from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  name: string;
  code?: string;
  latitude: number;
  longitude: number;
  kind: "MINE" | "INCIDENT" | "INSPECTION";
  mineType?: string;
  status?: string;
  region?: string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "NORMAL" | "WARNING" | "UNKNOWN";
  complianceScore?: number;
  lastInspectionDate?: string;
  openIssues?: number;
  openCapaCount?: number;
  detail?: string;
  distanceKm?: number;
}

// Marker styling helpers
function createMineIcon(riskLevel?: string) {
  let bg = "#10B981"; // Emerald green (Low / Compliant)
  let ring = "rgba(16, 185, 129, 0.4)";
  let text = "MINE";

  if (riskLevel === "CRITICAL") {
    bg = "#EF4444";
    ring = "rgba(239, 68, 68, 0.45)";
    text = "CRIT";
  } else if (riskLevel === "HIGH") {
    bg = "#EA580C";
    ring = "rgba(234, 88, 12, 0.45)";
    text = "HIGH";
  } else if (riskLevel === "MEDIUM" || riskLevel === "WARNING") {
    bg = "#F59E0B";
    ring = "rgba(245, 158, 11, 0.4)";
    text = "WARN";
  }

  return L.divIcon({
    className: "coalguard-mine-marker",
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        <span style="position:absolute;width:32px;height:32px;border-radius:50%;background:${ring};animation:pulse 2s infinite;"></span>
        <div style="position:relative;width:26px;height:26px;border-radius:50%;background:${bg};border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          <svg style="width:13px;height:13px;fill:#ffffff;" viewBox="0 0 24 24">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6-4.3 4.3a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l4.3-4.3 1.6 1.6a1 1 0 0 0 1.4 0 1 1 0 0 0 0-1.4l-6-6a1 1 0 0 0-1.4 0zM3.7 20.3a1 1 0 0 0 1.4 0l8.3-8.3-1.4-1.4-8.3 8.3a1 1 0 0 0 0 1.4z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

function createIncidentIcon(severity?: string) {
  const bg = severity === "CRITICAL" ? "#DC2626" : severity === "HIGH" ? "#EA580C" : "#F59E0B";
  return L.divIcon({
    className: "coalguard-incident-marker",
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="width:24px;height:24px;border-radius:6px;background:${bg};border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          <svg style="width:13px;height:13px;fill:#ffffff;" viewBox="0 0 24 24">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createInspectionIcon() {
  return L.divIcon({
    className: "coalguard-inspection-marker",
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
        <div style="width:24px;height:24px;border-radius:50%;background:#0284C7;border:2px solid #ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          <svg style="width:13px;height:13px;fill:#ffffff;" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const userLocationIcon = L.divIcon({
  className: "coalguard-user-location-marker",
  html: `
    <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
      <span style="position:absolute;width:24px;height:24px;border-radius:50%;background:rgba(37,99,235,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <div style="position:relative;width:14px;height:14px;border-radius:50%;background:#2563EB;border:3px solid #ffffff;box-shadow:0 0 8px rgba(37,99,235,0.8);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Map Controller for smooth flyTo and bounds fitting
function MapController({
  focusCoords,
  fitAllBounds,
  points,
}: {
  focusCoords?: [number, number] | null;
  fitAllBounds?: boolean;
  points: MapPoint[];
}) {
  const map = useMap();

  React.useEffect(() => {
    if (focusCoords) {
      map.flyTo(focusCoords, 13, { duration: 1.2 });
    }
  }, [focusCoords, map]);

  React.useEffect(() => {
    if (fitAllBounds && points.length > 0) {
      const validPoints = points.filter(
        (p) =>
          typeof p.latitude === "number" &&
          typeof p.longitude === "number" &&
          p.latitude >= -90 &&
          p.latitude <= 90 &&
          p.longitude >= -180 &&
          p.longitude <= 180
      );
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map((p) => [p.latitude, p.longitude]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [fitAllBounds, points, map]);

  return null;
}

export interface MineMapProps {
  points: MapPoint[];
  selectedPointId?: string | null;
  onSelectPoint?: (point: MapPoint) => void;
  userLocation?: { latitude: number; longitude: number; accuracy: number } | null;
  focusCoords?: [number, number] | null;
  fitAllTrigger?: number;
  className?: string;
}

export function MineMap({
  points,
  selectedPointId,
  onSelectPoint,
  userLocation,
  focusCoords,
  fitAllTrigger = 0,
  className = "h-[32rem] w-full",
}: MineMapProps) {
  // Validate coordinates: latitude -90 to +90, longitude -180 to +180
  const validPoints = React.useMemo(() => {
    return points.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude) &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        p.longitude >= -180 &&
        p.longitude <= 180
    );
  }, [points]);

  const defaultCenter: [number, number] = validPoints[0]
    ? [validPoints[0].latitude, validPoints[0].longitude]
    : [23.2599, 82.3616]; // Default to Coal India central region (SECL Shakti)

  const markerRefs = React.useRef<Map<string, L.Marker>>(new Map());

  // Auto open popup when selectedPointId changes
  React.useEffect(() => {
    if (selectedPointId) {
      const marker = markerRefs.current.get(selectedPointId);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedPointId]);

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border shadow-sm ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={validPoints.length > 1 ? 7 : 10}
        scrollWheelZoom
        className="h-full w-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          focusCoords={focusCoords}
          fitAllBounds={fitAllTrigger > 0}
          points={validPoints}
        />

        {/* User Geolocation Marker and Accuracy Radius */}
        {userLocation && (
          <>
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userLocationIcon}>
              <Popup>
                <div className="p-1">
                  <p className="text-xs font-bold text-primary">Your Current Location</p>
                  <p className="text-[10px] text-muted-foreground">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                    {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={Math.min(userLocation.accuracy, 2000)}
              pathOptions={{
                color: "#2563EB",
                fillColor: "#3B82F6",
                fillOpacity: 0.12,
                weight: 1.5,
              }}
            />
          </>
        )}

        {/* Map Points (Mines, Incidents, Inspections) */}
        {validPoints.map((p) => {
          let icon = createMineIcon(p.riskLevel);
          if (p.kind === "INCIDENT") {
            icon = createIncidentIcon(p.riskLevel);
          } else if (p.kind === "INSPECTION") {
            icon = createInspectionIcon();
          }

          return (
            <Marker
              key={`${p.kind}-${p.id}`}
              position={[p.latitude, p.longitude]}
              icon={icon}
              ref={(ref) => {
                if (ref) markerRefs.current.set(p.id, ref);
                else markerRefs.current.delete(p.id);
              }}
              eventHandlers={{
                click: () => onSelectPoint?.(p),
              }}
            >
              <Popup className="coalguard-map-popup">
                <div className="min-w-[210px] max-w-[260px] p-0.5 space-y-1.5 text-foreground font-sans">
                  {/* Header Title */}
                  <div className="border-b border-border/80 pb-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {p.kind}
                      </span>
                      {p.status && (
                        <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] font-semibold">
                          {p.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground leading-snug mt-0.5">{p.name}</p>
                    {p.code && (
                      <p className="font-mono text-[10px] text-muted-foreground">ID: {p.code}</p>
                    )}
                  </div>

                  {/* Body Attributes */}
                  <div className="space-y-1 text-[11px]">
                    {p.mineType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">
                          {p.mineType.replace(/_/g, " ").toLowerCase()}
                        </span>
                      </div>
                    )}
                    {p.region && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region:</span>
                        <span className="font-medium">{p.region}</span>
                      </div>
                    )}
                    {p.riskLevel && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risk Level:</span>
                        <span
                          className={`font-semibold ${
                            p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH"
                              ? "text-destructive"
                              : p.riskLevel === "MEDIUM" || p.riskLevel === "WARNING"
                              ? "text-warning"
                              : "text-success"
                          }`}
                        >
                          {p.riskLevel}
                        </span>
                      </div>
                    )}
                    {typeof p.complianceScore === "number" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Compliance:</span>
                        <span className="font-semibold text-foreground">
                          {p.complianceScore}%
                        </span>
                      </div>
                    )}
                    {p.distanceKm !== undefined && (
                      <div className="flex justify-between border-t border-border/60 pt-1 font-semibold text-primary">
                        <span>Distance:</span>
                        <span>{p.distanceKm.toFixed(1)} km</span>
                      </div>
                    )}
                    {p.detail && (
                      <p className="text-[10px] text-muted-foreground pt-0.5 italic">
                        {p.detail}
                      </p>
                    )}
                  </div>

                  {/* Action Links */}
                  {p.kind === "MINE" && (
                    <div className="pt-2 border-t border-border/80 grid grid-cols-2 gap-1.5">
                      <a
                        href={`/mines/${p.id}`}
                        className="block w-full text-center rounded bg-primary py-1 text-[10px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        View Mine
                      </a>
                      <a
                        href={`/inspections?mineId=${p.id}`}
                        className="block w-full text-center rounded bg-secondary py-1 text-[10px] font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border/70"
                      >
                        Inspections
                      </a>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MineMap;
