"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth/provider";
import { LoadingState } from "../ui/data-states";
import { DesktopSidebar, MobileDrawer } from "./sidebar";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { ctx, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !ctx) router.replace("/login");
  }, [loading, ctx, router]);

  if (loading) return <LoadingState label="Loading your workspace…" className="min-h-screen" />;
  if (!ctx) return null;

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMenuOpen(true)} />
        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
