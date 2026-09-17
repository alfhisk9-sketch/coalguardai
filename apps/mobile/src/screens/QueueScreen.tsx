import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { useQueue } from "../lib/queue-provider";
import { clearableOperations } from "../lib/queue";
import { theme } from "../lib/theme";
import { Button, Card, Heading, Muted, Screen, StatusPill } from "../components/ui";

const TONE = {
  PENDING: "warning",
  SYNCING: "muted",
  SYNCED: "success",
  FAILED: "danger",
} as const;

export function QueueScreen({ goBack }: { goBack: () => void }) {
  const { operations, snapshot, syncAll, retryOne, clearSynced, syncing, connection } = useQueue();
  const clearable = clearableOperations(operations).length;

  return (
    <Screen>
      <ScrollView>
        <Heading>Offline queue</Heading>
        <Muted>
          {snapshot.total} record{snapshot.total === 1 ? "" : "s"} · {snapshot.pending} pending · {snapshot.failed} failed
        </Muted>

        <View style={{ height: theme.spacing(2) }} />

        <View style={{ gap: 8, marginBottom: theme.spacing(2) }}>
          <Button
            title={syncing ? "Syncing…" : "Sync all"}
            onPress={() => void syncAll()}
            loading={syncing}
            disabled={connection === "OFFLINE" || snapshot.pending + snapshot.failed === 0}
          />
          <Button title={`Clear synced (${clearable})`} variant="outline" onPress={() => void clearSynced()} disabled={clearable === 0} />
        </View>

        {operations.length === 0 ? (
          <Card>
            <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
              Nothing queued. Records you capture in the field appear here until they reach the server.
            </Text>
          </Card>
        ) : (
          [...operations].reverse().map((op) => {
            const photosOutstanding = op.photos.filter((p) => p.uploadStatus !== "UPLOADED").length;
            return (
              <Card key={op.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontWeight: "700", color: theme.colors.text }}>{op.label}</Text>
                    <Text style={{ fontSize: 11, color: theme.colors.muted, marginTop: 2 }}>
                      {new Date(op.clientCreatedAt).toLocaleString()}
                    </Text>
                  </View>
                  <StatusPill label={op.status} tone={TONE[op.status]} />
                </View>

                {op.photos.length > 0 ? (
                  <Text style={{ fontSize: 12, color: photosOutstanding > 0 ? theme.colors.warning : theme.colors.success }}>
                    {op.photos.length} photo{op.photos.length === 1 ? "" : "s"} ·{" "}
                    {photosOutstanding > 0 ? `${photosOutstanding} awaiting upload` : "all uploaded"}
                  </Text>
                ) : null}

                {op.lastError ? (
                  <Text style={{ fontSize: 12, color: theme.colors.danger, marginTop: 6 }}>
                    {op.lastError} (attempt {op.attempts})
                  </Text>
                ) : null}

                {op.status === "FAILED" ? (
                  <View style={{ marginTop: 10 }}>
                    <Button title="Retry" variant="outline" onPress={() => void retryOne(op.id)} disabled={connection === "OFFLINE"} />
                  </View>
                ) : null}
              </Card>
            );
          })
        )}

        <Button title="Back" variant="outline" onPress={goBack} />
      </ScrollView>
    </Screen>
  );
}
