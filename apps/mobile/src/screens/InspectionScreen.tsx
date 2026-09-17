import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { useQueue } from "../lib/queue-provider";
import { useFieldLocation, GpsCapture } from "../components/GpsCapture";
import { PhotoCapture } from "../components/PhotoCapture";
import { theme } from "../lib/theme";
import { Button, Card, Field, Heading, Muted, Screen, SeveritySelector, StatusPill } from "../components/ui";

type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/**
 * Complete field inspection flow, all of it offline-capable:
 * create inspection → capture GPS → add observations (with photos) → submit.
 * The inspection is queued immediately, so observations can be attached to it even
 * with no connectivity; the queue resolves the real inspectionId after sync.
 */
export function InspectionScreen({ goBack }: { goBack: () => void }) {
  const { enqueue, connection } = useQueue();
  const { location, capture } = useFieldLocation();

  const [mineId, setMineId] = React.useState("");
  const [inspectionType, setInspectionType] = React.useState("Routine safety inspection");
  const [inspectionQueueId, setInspectionQueueId] = React.useState<string | null>(null);

  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("MEDIUM");
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [observationCount, setObservationCount] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function startInspection() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const op = await enqueue({
        entity: "inspections",
        endpoint: "/api/inspections",
        label: inspectionType,
        payload: {
          mineId,
          inspectionType,
          scheduledDate: new Date().toISOString().slice(0, 10),
          ...(location.latitude !== null ? { latitude: location.latitude } : {}),
          ...(location.longitude !== null ? { longitude: location.longitude } : {}),
        },
      });
      setInspectionQueueId(op.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the inspection.");
    } finally {
      setBusy(false);
    }
  }

  async function addObservation() {
    if (busy || !inspectionQueueId) return;
    setBusy(true);
    setError(null);
    try {
      await enqueue({
        entity: "inspection_observations",
        // Endpoint is rewritten by the queue once the parent inspection has a real id.
        endpoint: "/api/inspections/pending/observations",
        label: `Observation (${severity})`,
        dependsOn: inspectionQueueId,
        photos,
        payload: {
          inspectionId: inspectionQueueId,
          description,
          severity,
          ...(location.latitude !== null ? { latitude: location.latitude } : {}),
          ...(location.longitude !== null ? { longitude: location.longitude } : {}),
        },
      });
      setObservationCount((c) => c + 1);
      setDescription("");
      setPhotos([]);
      setSeverity("MEDIUM");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the observation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView>
        <Heading>{inspectionQueueId ? "Inspection in progress" : "Start inspection"}</Heading>
        <Muted>
          {connection === "OFFLINE"
            ? "Offline — everything you record is saved on this device."
            : "Records are saved locally first, then synced."}
        </Muted>

        <View style={{ height: theme.spacing(2) }} />

        {!inspectionQueueId ? (
          <Card>
            <Field label="Mine ID" value={mineId} onChangeText={setMineId} placeholder="Mine UUID" />
            <Field label="Inspection type" value={inspectionType} onChangeText={setInspectionType} />
            <GpsCapture location={location} onCapture={() => void capture()} />
            {error ? <Text style={{ color: theme.colors.danger, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}
            <Button title="Start inspection" onPress={() => void startInspection()} loading={busy} disabled={!mineId || !inspectionType} />
          </Card>
        ) : (
          <>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontWeight: "700", color: theme.colors.text }}>{inspectionType}</Text>
                <StatusPill label={`${observationCount} observation${observationCount === 1 ? "" : "s"}`} tone="muted" />
              </View>
              <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 4 }}>
                Queued for sync. Observations you add are linked to it automatically.
              </Text>
            </Card>

            <Card>
              <Text style={{ fontWeight: "700", marginBottom: 10, color: theme.colors.text }}>Add observation</Text>
              <Field label="What did you observe?" value={description} onChangeText={setDescription} multiline placeholder="Describe the condition and any immediate risk." />
              <SeveritySelector value={severity} onChange={setSeverity} />
              <GpsCapture location={location} onCapture={() => void capture()} />
              <PhotoCapture photos={photos} onChange={setPhotos} />
              {error ? <Text style={{ color: theme.colors.danger, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}
              <Button title="Save observation" onPress={() => void addObservation()} loading={busy} disabled={description.trim().length < 3} />
            </Card>

            <Button title="Finish inspection" variant="outline" onPress={goBack} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
