import * as React from "react";
import { Text, View } from "react-native";
import { useQueue } from "../lib/queue-provider";
import { theme } from "../lib/theme";

/** Always-visible connectivity + queue state, so a field user is never guessing. */
export function SyncBanner() {
  const { connection, snapshot, syncing } = useQueue();
  const offline = connection === "OFFLINE";
  const outstanding = snapshot.pending + snapshot.failed;

  const bg = offline ? theme.colors.warning : snapshot.failed > 0 ? theme.colors.danger : theme.colors.success;
  const label = syncing
    ? "Syncing…"
    : offline
      ? `Offline — ${outstanding} record${outstanding === 1 ? "" : "s"} queued`
      : snapshot.failed > 0
        ? `${snapshot.failed} failed — tap Sync queue`
        : outstanding > 0
          ? `${outstanding} pending`
          : "All records synced";

  return (
    <View style={{ backgroundColor: bg, paddingVertical: 6, paddingHorizontal: 12 }}>
      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600", textAlign: "center" }}>{label}</Text>
    </View>
  );
}
