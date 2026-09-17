import * as React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from "react-native";
import { theme } from "../lib/theme";

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
  disabled?: boolean;
  loading?: boolean;
}) {
  const bg = variant === "primary" ? theme.colors.primary : variant === "danger" ? theme.colors.danger : "transparent";
  const fg = variant === "outline" ? theme.colors.primary : theme.colors.primaryText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 },
        variant === "outline" ? styles.buttonOutline : null,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "email-address";
}) {
  return (
    <View style={{ marginBottom: theme.spacing(2) }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
        style={[styles.input, multiline ? { height: 110, textAlignVertical: "top" } : null]}
      />
    </View>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "muted" }) {
  const color = {
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger: theme.colors.danger,
    muted: theme.colors.muted,
  }[tone];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

export function SeveritySelector({
  value,
  onChange,
}: {
  value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  onChange: (v: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
}) {
  const options = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  return (
    <View style={{ marginBottom: theme.spacing(2) }}>
      <Text style={styles.label}>Severity</Text>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {options.map((o) => (
          <Pressable
            key={o}
            accessibilityRole="button"
            accessibilityState={{ selected: value === o }}
            onPress={() => onChange(o)}
            style={[styles.severity, value === o ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary } : null]}
          >
            <Text style={{ fontSize: 12, fontWeight: "600", color: value === o ? "#fff" : theme.colors.muted }}>{o}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing(2) },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  heading: { fontSize: 18, fontWeight: "700", color: theme.colors.text, marginBottom: 4 },
  muted: { fontSize: 13, color: theme.colors.muted },
  label: { fontSize: 13, fontWeight: "600", color: theme.colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    paddingHorizontal: 12,
    minHeight: theme.touchTarget,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: "#fff",
  },
  button: {
    minHeight: theme.touchTarget,
    borderRadius: theme.radius,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonOutline: { borderWidth: 1, borderColor: theme.colors.primary },
  buttonText: { fontSize: 16, fontWeight: "600" },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" },
  severity: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius,
    alignItems: "center",
    justifyContent: "center",
  },
});
