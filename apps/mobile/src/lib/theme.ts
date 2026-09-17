/** Shared tokens so every screen looks like one app. Mirrors the web palette. */
export const theme = {
  colors: {
    background: "#F5F7FA",
    card: "#FFFFFF",
    border: "#DDE3EA",
    text: "#1F2937",
    muted: "#6B7280",
    primary: "#0C3B82",
    primaryText: "#FFFFFF",
    success: "#1B7F4C",
    warning: "#B45309",
    danger: "#B4232A",
  },
  spacing: (n: number) => n * 8,
  radius: 10,
  /** Minimum comfortable target for gloved hands outdoors. */
  touchTarget: 52,
} as const;
