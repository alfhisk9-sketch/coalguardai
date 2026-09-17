import * as React from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/lib/auth";
import { QueueProvider } from "./src/lib/queue-provider";
import { SyncBanner } from "./src/components/SyncBanner";
import { LoginScreen } from "./src/screens/LoginScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { InspectionScreen } from "./src/screens/InspectionScreen";
import { IncidentScreen } from "./src/screens/IncidentScreen";
import { AttendanceScreen } from "./src/screens/AttendanceScreen";
import { QueueScreen } from "./src/screens/QueueScreen";
import { theme } from "./src/lib/theme";

type Screen = "home" | "inspection" | "incident" | "attendance" | "queue";

/**
 * Lightweight screen switch rather than a navigation library: five screens with no
 * deep-linking or nested stacks don't justify the extra dependency and its native
 * config. Swapping in @react-navigation later touches only this file.
 */
function Shell() {
  const { session, loading, configured } = useAuth();
  const [screen, setScreen] = React.useState<Screen>("home");

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  // Protected screens: without a session the only reachable screen is login.
  if (!session && configured) return <LoginScreen />;
  if (!session) return <LoginScreen />;

  const goHome = () => setScreen("home");

  return (
    <>
      <SyncBanner />
      {screen === "home" ? <HomeScreen navigate={(s) => setScreen(s as Screen)} /> : null}
      {screen === "inspection" ? <InspectionScreen goBack={goHome} /> : null}
      {screen === "incident" ? <IncidentScreen goBack={goHome} /> : null}
      {screen === "attendance" ? <AttendanceScreen goBack={goHome} /> : null}
      {screen === "queue" ? <QueueScreen goBack={goHome} /> : null}
    </>
  );
}

import { I18nProvider } from "./src/lib/i18n";

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <QueueProvider>
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <StatusBar style="dark" />
              <Shell />
            </SafeAreaView>
          </QueueProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
