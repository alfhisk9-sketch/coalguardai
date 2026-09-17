import * as React from "react";
import { ScrollView, Text } from "react-native";
import { useQueue } from "../lib/queue-provider";
import { GpsCapture, useFieldLocation } from "../components/GpsCapture";
import { PhotoCapture } from "../components/PhotoCapture";
import { theme } from "../lib/theme";
import { Button, Card, Field, Heading, Muted, Screen, SeveritySelector } from "../components/ui";

export function IncidentScreen({ goBack }: { goBack: () => void }) {
  const { enqueue, connection } = useQueue();
  const { location, capture } = useFieldLocation();
  const [mineId, setMineId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("HIGH");
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await enqueue({
        entity: "incidents",
        endpoint: "/api/incidents",
        label: `Incident (${severity})`,
        photos,
        payload: {
          mineId,
          occurredAt: new Date().toISOString(),
          description,
          severity,
          ...(location.latitude !== null ? { latitude: location.latitude } : {}),
          ...(location.longitude !== null ? { longitude: location.longitude } : {}),
        },
      });
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the incident.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView>
        <Heading>Report incident</Heading>
        <Muted>{connection === "OFFLINE" ? "Offline — saved on device, synced later." : "Saved locally, then synced."}</Muted>
        <Card>
          <Field label="Mine ID" value={mineId} onChangeText={setMineId} placeholder="Mine UUID" />
          <Field label="What happened?" value={description} onChangeText={setDescription} multiline />
          <SeveritySelector value={severity} onChange={setSeverity} />
          <GpsCapture location={location} onCapture={() => void capture()} />
          <PhotoCapture photos={photos} onChange={setPhotos} />
          {error ? <Text style={{ color: theme.colors.danger, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}
          <Button title="Submit incident" onPress={() => void submit()} loading={busy} disabled={!mineId || description.trim().length < 3} />
        </Card>
        <Button title="Cancel" variant="outline" onPress={goBack} />
      </ScrollView>
    </Screen>
  );
}
