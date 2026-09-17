import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../lib/auth/provider";
import { I18nProvider } from "../lib/i18n";

export const metadata: Metadata = {
  title: "CoalGuard AI — AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines",
  description:
    "AI-Powered Smart Governance & Compliance Monitoring System for Coal Mines. Ministry of Coal / Coal India Limited (SIH26024).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
