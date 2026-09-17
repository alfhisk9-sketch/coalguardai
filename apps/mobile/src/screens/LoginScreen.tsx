import * as React from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useAuth } from "../lib/auth";
import { useI18n } from "../lib/i18n";
import { theme } from "../lib/theme";
import { Button, Card, Field, Heading, Muted, Screen } from "../components/ui";
import { LanguagePicker } from "../components/LanguagePicker";

export function LoginScreen() {
  const { signIn, configured } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const message = await signIn(email, password);
    if (message) setError(message);
    setBusy(false);
  }

  function fillDemoInspector() {
    setEmail("krishna.demo@sih26024.test");
    setPassword("demo123");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: theme.spacing(2) }}>
          <Heading>{t("app_title")}</Heading>
          <Muted>CoalGuard Field Operations</Muted>
          <LanguagePicker />
        </View>

        <Card>
          <Field
            label={t("email_label")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="krishna.demo@sih26024.test"
          />
          <Field
            label={t("password_label")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? (
            <Text style={{ color: theme.colors.danger, fontSize: 13, marginBottom: 12 }} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <Button
            title={busy ? t("signing_in") : t("sign_in")}
            onPress={submit}
            loading={busy}
            disabled={!email || !password}
          />

          <TouchableOpacity
            onPress={fillDemoInspector}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "600" }}>
              Quick Fill: Krishna (Inspector)
            </Text>
          </TouchableOpacity>
        </Card>

        {!configured ? (
          <Card>
            <Text style={{ fontSize: 12, color: theme.colors.muted, lineHeight: 18 }}>
              Supabase environment variables are not configured. Set EXPO_PUBLIC_SUPABASE_URL,
              EXPO_PUBLIC_SUPABASE_ANON_KEY and EXPO_PUBLIC_API_BASE_URL (see .env.example). Sign-in cannot
              succeed until they are set.
            </Text>
          </Card>
        ) : null}

        <Text style={{ fontSize: 11, color: theme.colors.muted, textAlign: "center", marginTop: 12 }}>
          {t("demo_sih_note")}
        </Text>
      </ScrollView>
    </Screen>
  );
}
