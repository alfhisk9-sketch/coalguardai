import * as Location from "expo-location";

export interface FieldLocation {
  status: "IDLE" | "REQUESTING" | "AVAILABLE" | "DENIED" | "ERROR";
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  message: string | null;
}

export const EMPTY_LOCATION: FieldLocation = {
  status: "IDLE",
  latitude: null,
  longitude: null,
  accuracy: null,
  message: null,
};

/**
 * Real device GPS only. If permission is denied or a fix cannot be obtained, the record
 * is saved WITHOUT coordinates and the UI says so — coordinates are never fabricated.
 */
export async function captureLocation(): Promise<FieldLocation> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return { ...EMPTY_LOCATION, status: "DENIED", message: "Location permission denied. The record can still be saved without coordinates." };
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      status: "AVAILABLE",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy ?? null,
      message: null,
    };
  } catch {
    return { ...EMPTY_LOCATION, status: "ERROR", message: "Could not obtain a GPS fix. The record can still be saved." };
  }
}
