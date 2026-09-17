"use client";

import { useAuth } from "../../../lib/auth/provider";
import { PageHeader } from "../../../components/common/page-header";
import { CorporateDashboard } from "../../../components/dashboard/corporate-dashboard";
import { MineManagerDashboard } from "../../../components/dashboard/mine-dashboard";
import { InspectorDashboard } from "../../../components/dashboard/inspector-dashboard";
import { ContractorDashboard } from "../../../components/dashboard/contractor-dashboard";
import { LoadingState } from "../../../components/ui/data-states";

const HEADINGS: Record<string, { title: string; description: string }> = {
  SUPER_ADMIN: { title: "System overview", description: "All organizations, mines and system activity." },
  CORPORATE_ADMIN: { title: "Corporate overview", description: "Compliance and safety posture across every mine in your organization." },
  MINE_MANAGER: { title: "Mine overview", description: "Operational compliance and safety status for your mine." },
  INSPECTOR: { title: "Field workspace", description: "Your assigned inspections and field activity." },
  CONTRACTOR: { title: "Contractor workspace", description: "Your workforce, documents and compliance obligations." },
  REGULATOR: { title: "Regulatory overview", description: "Compliance posture across mines you are authorized to review." },
};

export default function DashboardPage() {
  const { primaryRole, loading } = useAuth();
  if (loading) return <LoadingState />;

  const heading = HEADINGS[primaryRole ?? ""] ?? { title: "Dashboard", description: "" };

  return (
    <>
      <PageHeader title={heading.title} description={heading.description} />
      {(primaryRole === "SUPER_ADMIN" || primaryRole === "CORPORATE_ADMIN") && <CorporateDashboard title={heading.title} />}
      {primaryRole === "REGULATOR" && <CorporateDashboard title={heading.title} readOnly />}
      {primaryRole === "MINE_MANAGER" && <MineManagerDashboard />}
      {primaryRole === "INSPECTOR" && <InspectorDashboard />}
      {primaryRole === "CONTRACTOR" && <ContractorDashboard />}
    </>
  );
}
