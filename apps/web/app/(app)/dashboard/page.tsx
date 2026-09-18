"use client";

import { useAuth } from "../../../lib/auth/provider";
import { useI18n } from "../../../lib/i18n";
import { PageHeader } from "../../../components/common/page-header";
import { CorporateDashboard } from "../../../components/dashboard/corporate-dashboard";
import { MineManagerDashboard } from "../../../components/dashboard/mine-dashboard";
import { InspectorDashboard } from "../../../components/dashboard/inspector-dashboard";
import { ContractorDashboard } from "../../../components/dashboard/contractor-dashboard";
import { QuickActionsBar } from "../../../components/dashboard/quick-actions-bar";
import { ComplianceHealthSummary } from "../../../components/dashboard/compliance-health-summary";
import { ExpiringDocumentsPanel } from "../../../components/dashboard/expiring-documents-panel";
import { SystemStatusCard } from "../../../components/dashboard/system-status-card";
import { LoadingState } from "../../../components/ui/data-states";

export default function DashboardPage() {
  const { primaryRole, loading } = useAuth();
  const { t } = useI18n();

  if (loading) return <LoadingState />;

  const getHeading = () => {
    switch (primaryRole) {
      case "SUPER_ADMIN":
        return { title: t("heading_super_admin"), description: t("heading_super_admin_desc") };
      case "CORPORATE_ADMIN":
        return { title: t("heading_corporate_admin"), description: t("heading_corporate_admin_desc") };
      case "MINE_MANAGER":
        return { title: t("heading_mine_manager"), description: t("heading_mine_manager_desc") };
      case "INSPECTOR":
        return { title: t("heading_inspector"), description: t("heading_inspector_desc") };
      case "CONTRACTOR":
        return { title: t("heading_contractor"), description: t("heading_contractor_desc") };
      case "REGULATOR":
        return { title: t("heading_regulator"), description: t("heading_regulator_desc") };
      default:
        return { title: t("nav_dashboard"), description: t("app_subtitle") };
    }
  };

  const heading = getHeading();

  return (
    <div className="space-y-6">
      <PageHeader title={heading.title} description={heading.description} />

      {/* Role-aware Quick Actions Bar */}
      <QuickActionsBar />

      {/* Role-specific Main Content */}
      {(primaryRole === "SUPER_ADMIN" || primaryRole === "CORPORATE_ADMIN") && (
        <div className="space-y-5">
          <CorporateDashboard title={heading.title} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ComplianceHealthSummary />
            <ExpiringDocumentsPanel />
          </div>
        </div>
      )}

      {primaryRole === "REGULATOR" && (
        <div className="space-y-5">
          <CorporateDashboard title={heading.title} readOnly />
          <ComplianceHealthSummary />
        </div>
      )}

      {primaryRole === "MINE_MANAGER" && (
        <div className="space-y-5">
          <MineManagerDashboard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ComplianceHealthSummary />
            <ExpiringDocumentsPanel />
          </div>
        </div>
      )}

      {primaryRole === "INSPECTOR" && (
        <div className="space-y-5">
          <InspectorDashboard />
          <ComplianceHealthSummary breakdown={{ safety: 92, inspections: 94, capa: 85 }} />
        </div>
      )}

      {primaryRole === "CONTRACTOR" && (
        <div className="space-y-5">
          <ContractorDashboard />
          <ExpiringDocumentsPanel expiredCount={0} expiring7Count={1} expiring30Count={2} validCount={6} />
        </div>
      )}

      {/* Verified System Status Card across all roles */}
      <div className="pt-2">
        <SystemStatusCard />
      </div>
    </div>
  );
}
