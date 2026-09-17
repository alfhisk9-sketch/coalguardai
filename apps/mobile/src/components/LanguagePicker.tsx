import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SUPPORTED_LOCALES, type Locale } from "@sih/config";
import { useI18n } from "../lib/i18n";
import { theme } from "../lib/theme";

export function LanguagePicker() {
  const { locale, setLocale } = useI18n();

  return (
    <View style={styles.container}>
      {SUPPORTED_LOCALES.map((l) => {
        const active = locale === l.code;
        return (
          <TouchableOpacity
            key={l.code}
            onPress={() => setLocale(l.code as Locale)}
            style={[styles.chip, active && styles.activeChip]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, active && styles.activeText]}>
              {l.nativeName}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
  },
  activeText: {
    color: "#ffffff",
  },
});
