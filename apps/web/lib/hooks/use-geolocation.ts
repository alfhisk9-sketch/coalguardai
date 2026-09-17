"use client";

import * as React from "react";

export interface GeoState {
  status: "idle" | "requesting" | "available" | "denied" | "unsupported" | "error";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  message: string | null;
}

/**
 * Real browser geolocation only. Coordinates are never fabricated when permission is
 * denied or unavailable — the UI states that GPS is unavailable instead (project rule 33).
 */
export function useGeolocation(): GeoState & { capture: () => void } {
  const [state, setState] = React.useState<GeoState>({
    status: "idle",
    latitude: null,
    longitude: null,
    accuracy: null,
    message: null,
  });

  const capture = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ status: "unsupported", latitude: null, longitude: null, accuracy: null, message: "Geolocation is not supported by this browser." });
      return;
    }
    setState((s) => ({ ...s, status: "requesting", message: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          status: "available",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          message: null,
        });
      },
      (err) => {
        setState({
          status: err.code === err.PERMISSION_DENIED ? "denied" : "error",
          latitude: null,
          longitude: null,
          accuracy: null,
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. The inspection can still be submitted without coordinates."
              : "Could not determine your location.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return { ...state, capture };
}
