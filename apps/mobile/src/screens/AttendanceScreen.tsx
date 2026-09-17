import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { useQueue } from "../lib/queue-provider";
import { GpsCapture, useFieldLocation } from "../components/GpsCapture";
import { theme } from "../lib/theme";
import { Button, Card, Field, Heading, Muted, Screen } from "../components/ui";

type Status = "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE";

export function AttendanceScreen({ goBack }: { goBack: () => void }) {
  const { enqueue } = useQueue();
  const { location, capture } = useFieldLocation();
  const [workerId, setWorkerId] = React.useState("");
  const [mineId, setMineId] = React.useState("");
  const [status, setStatus] = React.useState<Status>("PRESENT");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function record(kind: "IN" | "OUT") {
    if (busy) return;
    setBusy(true);
    setError(null);
    const now = new Date().toISOString();
    try {
      await enqueue({
        entity: "worker_attendance",
        endpoint: "/api/attendance",
        label: `Attendance ${kind === "IN" ? "check-in" : "check-out"}`,
        payload: {
          workerId,
          mineId,
          attendanceDate: now.slice(0, 10),
          ...(kind === "IN" ? { checkIn: now } : { checkOut: now }),
          status,
          ...(location.latitude !== null ? { latitude: location.latitude } : {}),
          ...(location.longitude !== null ? { longitude: location.longitude } : {}),
        },
      });
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record attendance.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView>
        <Heading>Attendance</Heading>
        <Muted>Check a worker in or out. No biometrics are used.</Muted>
        <Card>
          <Field label="Worker ID" value={workerId} onChangeText={setWorkerId} placeholder="Worker UUID" />
          <Field label="Mine ID" value={mineId} onChangeText={setMineId} placeholder="Mine UUID" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.colors.text, marginBottom: 6 }}>Status</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE"] as Status[]).map((s) => (
              <View key={s} style={{ flexGrow: 1, minWidth: "45%" }}>
                <Button title={s.replace("_", " ")} variant={status === s ? "primary" : "outline"} onPress={() => setStatus(s)} />
              </View>
            ))}
          </View>
          <GpsCapture location={location} onCapture={() => void capture()} />
          {error ? <Text style={{ color: theme.colors.danger, fontSize: 13, marginBottom: 10 }}>{error}</Text> : null}
          <View style={{ gap: 8 }}>
            <Button title="Check in" onPress={() => void record("IN")} loading={busy} disabled={!workerId || !mineId} />
            <Button title="Check out" variant="outline" onPress={() => void record("OUT")} loading={busy} disabled={!workerId || !mineId} />
          </View>
        </Card>
        <Button title="Back" variant="outline" onPress={goBack} />
      </ScrollView>
    </Screen>
  );
}
