import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth/provider";
import { I18nProvider } from "../lib/i18n";

export const metadata: Metadata = {
  title: "CoalGuard AI — Safer Mines, Smarter Governance",
  description:
    "Enterprise Mining Compliance, Safety, Workforce, Inspection, Incident, and AI Governance Platform. Safer Mines — Smarter Governance.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/branding/coalguard-icon.png",
  },
  openGraph: {
    title: "CoalGuard AI — Safer Mines, Smarter Governance",
    description: "Enterprise mining compliance and smart governance platform.",
    images: ["/branding/coalguard-logo.png"],
    siteName: "CoalGuard AI",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0B192C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
