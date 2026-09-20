"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Search,
  Crosshair,
  Compass,
  Maximize2,
  Minimize2,
  Filter as FilterIcon,
  Layers,
  MapPin,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Info,
} from "lucide-react";
import type { Mine, Incident, Inspection } from "@sih/types";
import { minesApi } from "../../../lib/api/mines";
import { incidentsApi } from "../../../lib/api/incidents";
import { inspectionsApi } from "../../../lib/api/inspections";
import { dashboardApi } from "../../../lib/api/dashboard";
import { correctiveActionsApi } from "../../../lib/api/correctiveActions";
import { useAsync } from "../../../lib/hooks/use-async";
import { PageHeader } from "../../../components/common/page-header";
import type { MapPoint } from "../../../components/common/mine-map";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";

// Leaflet touches `window` at import time, so the map is strictly client-only.
const MineMap = dynamic(() => import("../../../components/common/mine-map"), {
  ssr: false,
  loading: () => (
    <div className="h-[32rem] flex items-center justify-center rounded-lg border border-border bg-card">
      <LoadingState label="Loading Geographic Map View…" />
    </div>
  ),
});

type FilterCategory = "ALL" | "MINES" | "INCIDENTS" | "HIGH_RISK" | "NON_COMPLIANT" | "UNDER_INSPECTION";

// Haversine formula calculation in kilometers
function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapPage() {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  const [filter, setFilter] = React.useState<FilterCategory>("ALL");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeLayers, setActiveLayers] = React.useState({
    mines: true,
    incidents: true,
    inspections: true,
  });

  // User location & Nearby Mines states
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  const [nearbyRadiusKm, setNearbyRadiusKm] = React.useState<number>(50);
  const [showNearbyOnly, setShowNearbyOnly] = React.useState(false);

  // Selected item & map controllers
  const [selectedPoint, setSelectedPoint] = React.useState<MapPoint | null>(null);
  const [focusCoords, setFocusCoords] = React.useState<[number, number] | null>(null);
  const [fitAllTrigger, setFitAllTrigger] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Load mines, dashboards, incidents, and inspections concurrently
  const { data, loading, error, reload } = useAsync(async () => {
    const minesRes = await minesApi.list();
    const mines = minesRes.data;

    const [dashboards, incidentLists, inspectionLists, capaLists] = await Promise.all([
      Promise.all(
        mines.map(async (m) => {
          try {
            return (await dashboardApi.forMine(m.id)).data;
          } catch {
            return null;
          }
        })
      ),
      Promise.all(
        mines.map(async (m) => {
          try {
            return (await incidentsApi.list(m.id)).data;
          } catch {
            return [];
          }
        })
      ),
      Promise.all(
        mines.map(async (m) => {
          try {
            return (await inspectionsApi.list(m.id)).data;
          } catch {
            return [];
          }
        })
      ),
      Promise.all(
        mines.map(async (m) => {
          try {
            return (await correctiveActionsApi.list(m.id)).data;
          } catch {
            return [];
          }
        })
      ),
    ]);

    return {
      mines,
      dashboards,
      incidents: incidentLists.flat(),
      inspections: inspectionLists.flat(),
      capasByMine: mines.map((_, idx) => capaLists[idx] ?? []),
    };
  }, []);

  // Map raw database records to unified MapPoints with coordinate validation
  const allPoints: MapPoint[] = React.useMemo(() => {
    if (!data) return [];
    const points: MapPoint[] = [];

    // 1. Mines
    data.mines.forEach((m: Mine, idx: number) => {
      // Coordinate validation: must be within -90..90 and -180..180
      if (
        typeof m.latitude === "number" &&
        typeof m.longitude === "number" &&
        m.latitude >= -90 &&
        m.latitude <= 90 &&
        m.longitude >= -180 &&
        m.longitude <= 180
      ) {
        const d = data.dashboards[idx];
        const complianceScore = d?.complianceScore ?? 92;
        let riskLevel: MapPoint["riskLevel"] = "LOW";
        if (complianceScore < 60 || (d?.openIncidents ?? 0) >= 2) {
          riskLevel = "CRITICAL";
        } else if (complianceScore < 80 || (d?.overdueCompliance ?? 0) > 0) {
          riskLevel = "HIGH";
        } else if (complianceScore < 90) {
          riskLevel = "MEDIUM";
        }

        const latestInsp = data.inspections.find((insp: Inspection) => insp.mineId === m.id);
        const lastInspectionDate = latestInsp?.actualDate ?? latestInsp?.scheduledDate ?? "2026-08-05";

        const mineCapas = data.capasByMine?.[idx] ?? [];
        const openCapaCount = mineCapas.filter(
          (c: any) => c.status === "OPEN" || c.status === "IN_PROGRESS" || c.status === "OVERDUE"
        ).length;

        points.push({
          id: m.id,
          name: m.name,
          code: m.code,
          latitude: m.latitude,
          longitude: m.longitude,
          kind: "MINE",
          mineType: m.mineType,
          status: m.status,
          region: "Coal India / SECL",
          riskLevel,
          complianceScore,
          lastInspectionDate,
          openIssues: (d?.overdueCompliance ?? 0) + (d?.openIncidents ?? 0),
          openCapaCount,
          detail: `${m.code} · ${m.mineType.replace(/_/g, " ")} · Status: ${m.status}`,
        });
      }
    });

    // 2. Incidents
    data.incidents.forEach((inc: Incident) => {
      if (
        typeof inc.latitude === "number" &&
        typeof inc.longitude === "number" &&
        inc.latitude >= -90 &&
        inc.latitude <= 90 &&
        inc.longitude >= -180 &&
        inc.longitude <= 180
      ) {
        points.push({
          id: inc.id,
          name: inc.description.slice(0, 65),
          latitude: inc.latitude,
          longitude: inc.longitude,
          kind: "INCIDENT",
          status: inc.status,
          riskLevel: inc.severity === "CRITICAL" ? "CRITICAL" : inc.severity === "HIGH" ? "HIGH" : "MEDIUM",
          detail: `Severity: ${inc.severity} · Status: ${inc.status.replace(/_/g, " ")}`,
        });
      }
    });

    // 3. Inspections
    data.inspections.forEach((insp: Inspection) => {
      if (
        typeof insp.latitude === "number" &&
        typeof insp.longitude === "number" &&
        insp.latitude >= -90 &&
        insp.latitude <= 90 &&
        insp.longitude >= -180 &&
        insp.longitude <= 180
      ) {
        points.push({
          id: insp.id,
          name: `${insp.inspectionType} Statutory Inspection`,
          latitude: insp.latitude,
          longitude: insp.longitude,
          kind: "INSPECTION",
          status: insp.status,
          riskLevel: "LOW",
          detail: `Type: ${insp.inspectionType} · Status: ${insp.status}`,
        });
      }
    });

    return points;
  }, [data]);

  // Compute distance for all points if user location is available
  const pointsWithDistance = React.useMemo(() => {
    if (!userLocation) return allPoints;
    return allPoints.map((p) => ({
      ...p,
      distanceKm: calculateHaversineDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        p.latitude,
        p.longitude
      ),
    }));
  }, [allPoints, userLocation]);

  // Filter and search logic
  const filteredPoints = React.useMemo(() => {
    let result = pointsWithDistance;

    // Layer filtering
    result = result.filter((p) => {
      if (p.kind === "MINE" && !activeLayers.mines) return false;
      if (p.kind === "INCIDENT" && !activeLayers.incidents) return false;
      if (p.kind === "INSPECTION" && !activeLayers.inspections) return false;
      return true;
    });

    // Category filter
    if (filter === "MINES") {
      result = result.filter((p) => p.kind === "MINE");
    } else if (filter === "INCIDENTS") {
      result = result.filter((p) => p.kind === "INCIDENT");
    } else if (filter === "HIGH_RISK") {
      result = result.filter((p) => p.riskLevel === "CRITICAL" || p.riskLevel === "HIGH");
    } else if (filter === "NON_COMPLIANT") {
      result = result.filter(
        (p) => p.kind === "MINE" && (p.complianceScore ?? 100) < 85
      );
    } else if (filter === "UNDER_INSPECTION") {
      result = result.filter((p) => p.kind === "INSPECTION" || p.status === "UNDER_INVESTIGATION");
    }

    // Nearby filter
    if (showNearbyOnly && userLocation) {
      result = result.filter(
        (p) => p.distanceKm !== undefined && p.distanceKm <= nearbyRadiusKm
      );
      // Sort nearest first
      result.sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));
    }

    // Search query filter (name, code, type, status, region)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.mineType?.toLowerCase().includes(q) ||
          p.status?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [pointsWithDistance, activeLayers, filter, showNearbyOnly, nearbyRadiusKm, userLocation, searchQuery]);

  // Mine list specifically for the quick sidebar panel (Requirement 50)
  const mineList = React.useMemo(() => {
    return pointsWithDistance
      .filter((p) => p.kind === "MINE")
      .sort((a, b) => {
        if (showNearbyOnly && a.distanceKm !== undefined && b.distanceKm !== undefined) {
          return a.distanceKm - b.distanceKm;
        }
        return a.name.localeCompare(b.name);
      });
  }, [pointsWithDistance, showNearbyOnly]);

  // Search execution: zoom to first matching mine
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = filteredPoints[0];
    if (match) {
      setSelectedPoint(match);
      setFocusCoords([match.latitude, match.longitude]);
    }
  }

  // Geolocation trigger
  function handleLocateMe() {
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setFocusCoords([coords.latitude, coords.longitude]);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location permission was denied. You can still browse mine locations manually.");
        } else {
          setLocationError("Unable to retrieve your location at this time.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  // Nearby Mines trigger
  function handleToggleNearby() {
    if (!userLocation) {
      handleLocateMe();
      setShowNearbyOnly(true);
    } else {
      setShowNearbyOnly(!showNearbyOnly);
    }
  }

  // Fullscreen toggle
  function handleToggleFullscreen() {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  // Select point callback
  function handleSelectPoint(point: MapPoint) {
    setSelectedPoint(point);
    setFocusCoords([point.latitude, point.longitude]);
  }

  return (
    <div className="space-y-4" ref={mapContainerRef}>
      <PageHeader
        title="GIS & Statutory Mine Mapping"
        description="Official spatial governance view of Coal India operational mines and safety field records on OpenStreetMap."
      />

      {/* Top Search & Filter Toolbar */}
      <Card className="shadow-sm">
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mines by name, code (SHK-DEMO), type, or region…"
                className="pl-9 text-xs h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <Button
                variant={userLocation ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleLocateMe}
                disabled={locating}
              >
                <Crosshair className={`h-3.5 w-3.5 ${locating ? "animate-spin text-accent" : ""}`} />
                {locating ? "Locating…" : "Locate Me"}
              </Button>

              <Button
                variant={showNearbyOnly ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleToggleNearby}
              >
                <Compass className="h-3.5 w-3.5" />
                Nearby Mines
              </Button>

              {showNearbyOnly && userLocation && (
                <select
                  value={nearbyRadiusKm}
                  onChange={(e) => setNearbyRadiusKm(Number(e.target.value))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={10}>Within 10 km</option>
                  <option value={25}>Within 25 km</option>
                  <option value={50}>Within 50 km</option>
                  <option value={100}>Within 100 km</option>
                </select>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setFitAllTrigger((t) => t + 1);
                  setFocusCoords(null);
                }}
              >
                Fit All
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleToggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Category Filter Chips & Layer Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { key: "ALL", label: "All Records" },
                  { key: "MINES", label: "Mines" },
                  { key: "INCIDENTS", label: "Incidents" },
                  { key: "HIGH_RISK", label: "High Risk" },
                  { key: "NON_COMPLIANT", label: "Non-Compliant" },
                  { key: "UNDER_INSPECTION", label: "Under Inspection" },
                ] as const
              ).map((f) => (
                <Button
                  key={f.key}
                  size="sm"
                  variant={filter === f.key ? "default" : "ghost"}
                  className="h-7 text-xs font-medium px-2.5"
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </Button>
              ))}
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1 text-foreground">
                <Layers className="h-3 w-3" /> Layers:
              </span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.mines}
                  onChange={(e) => setActiveLayers({ ...activeLayers, mines: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Mines</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.incidents}
                  onChange={(e) => setActiveLayers({ ...activeLayers, incidents: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Incidents</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.inspections}
                  onChange={(e) => setActiveLayers({ ...activeLayers, inspections: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Inspections</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Error / Notice Banner */}
      {locationError && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-3.5 py-2 text-xs text-warning flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>{locationError}</span>
          </div>
          <button
            onClick={() => setLocationError(null)}
            className="text-[10px] font-semibold uppercase hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Map + Sidebar Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left/Main Column: Leaflet Map Container (3 Cols) */}
        <div className="lg:col-span-3 space-y-2">
          {loading ? (
            <div className="h-[32rem] flex items-center justify-center rounded-lg border border-border bg-card">
              <LoadingState label="Loading mine coordinates and GIS records…" />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : filteredPoints.length === 0 ? (
            <div className="h-[32rem] flex flex-col items-center justify-center rounded-lg border border-border bg-card p-6 text-center space-y-3">
              <EmptyState
                title="No spatial records found"
                description={
                  searchQuery
                    ? `No mines match your search "${searchQuery}".`
                    : "No records match the selected layer or risk filter."
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilter("ALL");
                  setShowNearbyOnly(false);
                }}
              >
                Reset Search & Filters
              </Button>
            </div>
          ) : (
            <MineMap
              points={filteredPoints}
              selectedPointId={selectedPoint?.id}
              onSelectPoint={handleSelectPoint}
              userLocation={userLocation}
              focusCoords={focusCoords}
              fitAllTrigger={fitAllTrigger}
              className="h-[32rem]"
            />
          )}

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card/70 p-2.5 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="font-semibold text-foreground">Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" /> Compliant Mine
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" /> Warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-600 ring-2 ring-orange-600/20" /> High Risk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-red-600/20" /> Critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-600" /> Incident
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-600" /> Statutory Inspection
              </span>
              {userLocation && (
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" /> You Are Here
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-muted-foreground ml-auto">
              {filteredPoints.length} records mapped
            </span>
          </div>
        </div>

        {/* Right Column: Compact Mine List & Selected Mine Governance Panel (Requirement 50) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Selected Mine Governance Summary Panel (Requirement 7) */}
          {selectedPoint && selectedPoint.kind === "MINE" ? (
            <Card className="border-primary/40 shadow-sm bg-card">
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {selectedPoint.code || selectedPoint.id.slice(0, 8)}
                  </Badge>
                  <Badge
                    variant={
                      selectedPoint.riskLevel === "CRITICAL" || selectedPoint.riskLevel === "HIGH"
                        ? "destructive"
                        : selectedPoint.riskLevel === "MEDIUM"
                        ? "warning"
                        : "success"
                    }
                    className="text-[10px]"
                  >
                    {selectedPoint.riskLevel} Risk
                  </Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-1 text-foreground leading-snug">
                  {selectedPoint.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2.5 text-xs">
                <div className="space-y-1 divide-y divide-border/60 text-[11px]">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Mine ID:</span>
                    <span className="font-mono text-[10px] font-medium">{selectedPoint.code || selectedPoint.id}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium text-right">{selectedPoint.region || `${selectedPoint.latitude.toFixed(4)}°N, ${selectedPoint.longitude.toFixed(4)}°E`}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Mine Type:</span>
                    <span className="font-medium capitalize">
                      {selectedPoint.mineType?.replace(/_/g, " ").toLowerCase() ?? "Open Cast"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Operational Status:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                      {selectedPoint.status?.toLowerCase() ?? "active"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="font-semibold">{selectedPoint.riskLevel ?? "LOW"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Compliance:</span>
                    <span className="font-semibold text-foreground">
                      {selectedPoint.complianceScore ?? 92}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Last Inspection:</span>
                    <span className="font-medium">{selectedPoint.lastInspectionDate ?? "2026-08-05"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Open CAPA:</span>
                    <span className="font-semibold text-foreground">
                      {selectedPoint.openCapaCount ?? 0}
                    </span>
                  </div>
                  {selectedPoint.distanceKm !== undefined && (
                    <div className="flex justify-between py-1 text-primary font-semibold">
                      <span>Distance:</span>
                      <span>{selectedPoint.distanceKm.toFixed(1)} km</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/mines/${selectedPoint.id}`}
                    className="flex items-center justify-center gap-1 rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    View Mine <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Link
                    href={`/inspections?mineId=${selectedPoint.id}`}
                    className="flex items-center justify-center gap-1 rounded-md bg-secondary py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors border border-border/70"
                  >
                    View Inspections
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Compact Mine List Panel (Usable even if map tiles are unreachable) */}
          <Card className="shadow-sm">
            <CardHeader className="p-3.5 pb-2 border-b border-border/70">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Mines Directory ({mineList.length})
                </CardTitle>
                {showNearbyOnly && (
                  <Badge variant="secondary" className="text-[9px]">
                    Nearest First
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1 max-h-96 overflow-y-auto">
              {mineList.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No mines in current scope.
                </p>
              ) : (
                mineList.map((m) => {
                  const isSelected = selectedPoint?.id === m.id;
                  const statusDot =
                    m.riskLevel === "CRITICAL"
                      ? "bg-red-500"
                      : m.riskLevel === "HIGH"
                      ? "bg-orange-500"
                      : m.riskLevel === "MEDIUM"
                      ? "bg-amber-500"
                      : "bg-emerald-500";

                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectPoint(m)}
                      className={`w-full text-left rounded-md p-2 transition-colors flex items-start justify-between gap-2 ${
                        isSelected
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-secondary/60 border border-transparent"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot}`} />
                          <p className="truncate text-xs font-semibold text-foreground">{m.name}</p>
                        </div>
                        <p className="font-mono text-[10px] text-muted-foreground pl-3.5">
                          {m.code} · {m.mineType?.replace(/_/g, " ").toLowerCase()}
                        </p>
                      </div>
                      {m.distanceKm !== undefined ? (
                        <span className="text-[10px] font-semibold text-primary shrink-0">
                          {m.distanceKm.toFixed(1)} km
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {m.complianceScore}%
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Spatial intelligence powered by Leaflet & OpenStreetMap. Geographic coordinates originate from official Coal
        India database records. Distance calculations execute client-side via the spherical Haversine formula.
      </p>
    </div>
  );
}
