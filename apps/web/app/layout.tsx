import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth/provider";
import { I18nProvider } from "../lib/i18n";

export const metadata: Metadata = {
  title: "CoalGuard AI — Smart Governance & Compliance Monitoring System for Coal Mines",
  description:
    "AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines. Ministry of Coal / Coal India Limited (SIH26024).",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
