import * as React from "react";
import { Text, View } from "react-native";
import { captureLocation, EMPTY_LOCATION, type FieldLocation } from "../lib/location";
import { theme } from "../lib/theme";
import { Button, StatusPill } from "./ui";

export function useFieldLocation() {
  const [location, setLocation] = React.useState<FieldLocation>(EMPTY_LOCATION);
  const capture = React.useCallback(async () => {
    setLocation((l) => ({ ...l, status: "REQUESTING" }));
    setLocation(await captureLocation());
  }, []);
  return { location, capture };
}

export function GpsCapture({ location, onCapture }: { location: FieldLocation; onCapture: () => void }) {
  const available = location.status === "AVAILABLE";
  return (
    <View style={{ marginBottom: theme.spacing(2) }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: theme.colors.text }}>Location</Text>
        <StatusPill
          label={available ? "GPS captured" : location.status === "REQUESTING" ? "Acquiring…" : "No GPS"}
          tone={available ? "success" : location.status === "DENIED" ? "danger" : "muted"}
        />
      </View>
      <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 8 }}>
        {available
          ? `${location.latitude?.toFixed(5)}, ${location.longitude?.toFixed(5)}${location.accuracy ? ` · ±${Math.round(location.accuracy)} m` : ""}`
          : (location.message ?? "Coordinates are optional. The record saves either way.")}
      </Text>
      <Button title={available ? "Recapture GPS" : "Capture GPS"} variant="outline" onPress={onCapture} />
    </View>
  );
}
