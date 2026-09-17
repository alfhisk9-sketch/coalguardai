import * as React from "react";
import { ScrollView, Text, View } from "react-native";
import { useQueue } from "../lib/queue-provider";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { theme } from "../lib/theme";
import { Button, Card, Heading, Muted, Screen, StatusPill } from "../components/ui";
import { LanguagePicker } from "../components/LanguagePicker";

export function HomeScreen({ navigate }: { navigate: (screen: string) => void }) {
  const { snapshot, connection, syncAll, syncing } = useQueue();
  const { signOut, session } = useAuth();
  const { t } = useI18n();

  const userName = (session?.user?.user_metadata?.full_name as string | undefined) || session?.user?.email || "Inspector";

  return (
    <Screen>
      <ScrollView>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing(2) }}>
          <View style={{ flex: 1 }}>
            <Heading>{t("field_workspace")}</Heading>
            <Muted>{userName} — {t("field_workspace_desc")}</Muted>
          </View>
          <StatusPill
            label={connection === "ONLINE" ? t("status_online") : connection === "OFFLINE" ? t("status_offline") : t("status_unknown")}
            tone={connection === "ONLINE" ? "success" : "warning"}
          />
        </View>

        {/* Multilingual selector for English, Hindi, Telugu */}
        <LanguagePicker />

        <Card>
          <Text style={{ fontWeight: "700", marginBottom: 8, color: theme.colors.text }}>{t("sync_status")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
            <Metric label={t("pending_label")} value={snapshot.pending} />
            <Metric label={t("failed_label")} value={snapshot.failed} />
            <Metric label={t("synced_label")} value={snapshot.synced} />
          </View>
          <Button
            title={syncing ? t("btn_syncing") : t("btn_sync")}
            onPress={() => void syncAll()}
            loading={syncing}
            disabled={connection === "OFFLINE"}
          />
          {connection === "OFFLINE" ? (
            <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 8 }}>
              {t("offline_notice")}
            </Text>
          ) : null}
        </Card>

        <Card>
          <Text style={{ fontWeight: "700", marginBottom: 12, color: theme.colors.text }}>{t("record_something")}</Text>
          <View style={{ gap: 8 }}>
            <Button title={t("btn_start_inspection")} onPress={() => navigate("inspection")} />
            <Button title={t("btn_report_incident")} variant="outline" onPress={() => navigate("incident")} />
            <Button title={t("btn_record_attendance")} variant="outline" onPress={() => navigate("attendance")} />
            <Button title={t("btn_offline_queue")} variant="outline" onPress={() => navigate("queue")} />
          </View>
        </Card>

        <Button title={t("sign_out")} variant="outline" onPress={() => void signOut()} />
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <Text style={{ fontSize: 22, fontWeight: "700", color: theme.colors.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: theme.colors.muted }}>{label}</Text>
    </View>
  );
}
