"use client";

import {
  LayoutDashboard, Mountain, Map, ClipboardCheck, ListChecks, FileText, ClipboardList,
  Eye, TriangleAlert, Building2, Users, CalendarCheck, Leaf, TrendingUp, BarChart3,
  MessageSquareWarning, ScrollText, Settings, Bot, Sparkles, Circle, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, Mountain, Map, ClipboardCheck, ListChecks, FileText, ClipboardList,
  Eye, TriangleAlert, Building2, Users, CalendarCheck, Leaf, TrendingUp, BarChart3,
  MessageSquareWarning, ScrollText, Settings, Bot, Sparkles,
};

export function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Circle;
  return <Icon className={className} aria-hidden="true" />;
}
