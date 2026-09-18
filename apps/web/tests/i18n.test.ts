import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  getTranslation,
  type Locale,
  type TranslationKey,
} from "@sih/config";
import { NAMED_DEMO_ACCOUNTS, buildDemoAuthContext } from "../lib/auth/demo";

describe("Language Support (i18n) — English, Hindi, Telugu Parity", () => {
  it("supports exactly en, hi, and te with valid labels", () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("hi");
    expect(codes).toContain("te");
    expect(SUPPORTED_LOCALES.length).toBe(3);
  });

  it("guarantees 100% key parity: every key in English exists in Hindi and Telugu", () => {
    const enKeys = Object.keys(TRANSLATIONS.en) as TranslationKey[];
    const hiKeys = Object.keys(TRANSLATIONS.hi) as TranslationKey[];
    const teKeys = Object.keys(TRANSLATIONS.te) as TranslationKey[];

    expect(enKeys.length).toBeGreaterThanOrEqual(100);
    expect(hiKeys.length).toBe(enKeys.length);
    expect(teKeys.length).toBe(enKeys.length);

    for (const key of enKeys) {
      expect(TRANSLATIONS.hi[key], `Missing Hindi translation for key: ${key}`).toBeDefined();
      expect(TRANSLATIONS.te[key], `Missing Telugu translation for key: ${key}`).toBeDefined();

      expect(TRANSLATIONS.en[key].length).toBeGreaterThan(0);
      expect(TRANSLATIONS.hi[key].length).toBeGreaterThan(0);
      expect(TRANSLATIONS.te[key].length).toBeGreaterThan(0);
    }
  });

  it("provides distinct native language translations for the Contractor Workspace", () => {
    // Verified fix for reported Telugu screenshot issue
    const contractorKeys: TranslationKey[] = [
      "contractor_workspace",
      "contractor_workspace_desc",
      "registered_workers",
      "documents",
      "expiring_soon",
      "contract_status",
      "status_active",
      "workers",
      "worker_name",
      "worker_id",
    ];

    for (const k of contractorKeys) {
      const enVal = getTranslation(k, "en");
      const hiVal = getTranslation(k, "hi");
      const teVal = getTranslation(k, "te");

      expect(enVal).toBeDefined();
      expect(hiVal).toBeDefined();
      expect(teVal).toBeDefined();

      // Telugu and Hindi must not be silently fallback English
      expect(hiVal).not.toBe(enVal);
      expect(teVal).not.toBe(enVal);
    }

    expect(getTranslation("contractor_workspace", "te")).toBe("కాంట్రాక్టర్ వర్క్స్పేస్");
    expect(getTranslation("registered_workers", "te")).toBe("నమోదైన కార్మికులు");
    expect(getTranslation("documents", "te")).toBe("పత్రాలు");
    expect(getTranslation("expiring_soon", "te")).toBe("త్వరలో గడువు ముగియనున్నవి");
    expect(getTranslation("contract_status", "te")).toBe("కాంట్రాక్ట్ స్థితి");
    expect(getTranslation("status_active", "te")).toBe("క్రియాశీల");
  });

  it("provides distinct native language translations for all 6 Role Dashboard Headings", () => {
    const roleHeadingKeys: TranslationKey[] = [
      "heading_super_admin",
      "heading_corporate_admin",
      "heading_mine_manager",
      "heading_inspector",
      "heading_contractor",
      "heading_regulator",
    ];

    for (const k of roleHeadingKeys) {
      const enVal = getTranslation(k, "en");
      const hiVal = getTranslation(k, "hi");
      const teVal = getTranslation(k, "te");

      expect(enVal.length).toBeGreaterThan(0);
      expect(hiVal.length).toBeGreaterThan(0);
      expect(teVal.length).toBeGreaterThan(0);
      expect(hiVal).not.toBe(enVal);
      expect(teVal).not.toBe(enVal);
    }
  });

  it("provides translations for Global Notification Center and Features", () => {
    const featureKeys: TranslationKey[] = [
      "notifications_title",
      "mark_all_read",
      "compliance_health_title",
      "overall_compliance",
      "expiring_documents_title",
      "quick_actions_title",
      "system_status_title",
      "ai_risk_score",
    ];

    for (const k of featureKeys) {
      for (const loc of ["en", "hi", "te"] as Locale[]) {
        const val = getTranslation(k, loc);
        expect(val).toBeDefined();
        expect(val.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Named SIH Team Demo Accounts", () => {
  it("defines all six SIH team members with their exact roles and emails", () => {
    expect(NAMED_DEMO_ACCOUNTS.SUPER_ADMIN.name).toBe("Alfhi");
    expect(NAMED_DEMO_ACCOUNTS.SUPER_ADMIN.email).toBe("alfhi.demo@sih26024.test");

    expect(NAMED_DEMO_ACCOUNTS.CORPORATE_ADMIN.name).toBe("Rabbani");
    expect(NAMED_DEMO_ACCOUNTS.CORPORATE_ADMIN.email).toBe("rabbani.demo@sih26024.test");

    expect(NAMED_DEMO_ACCOUNTS.MINE_MANAGER.name).toBe("Akshay");
    expect(NAMED_DEMO_ACCOUNTS.MINE_MANAGER.email).toBe("akshay.demo@sih26024.test");

    expect(NAMED_DEMO_ACCOUNTS.INSPECTOR.name).toBe("Krishna");
    expect(NAMED_DEMO_ACCOUNTS.INSPECTOR.email).toBe("krishna.demo@sih26024.test");

    expect(NAMED_DEMO_ACCOUNTS.CONTRACTOR.name).toBe("Koushik");
    expect(NAMED_DEMO_ACCOUNTS.CONTRACTOR.email).toBe("koushik.demo@sih26024.test");

    expect(NAMED_DEMO_ACCOUNTS.REGULATOR.name).toBe("Hema");
    expect(NAMED_DEMO_ACCOUNTS.REGULATOR.email).toBe("hema.demo@sih26024.test");
  });

  it("builds valid demo auth context for each team member", () => {
    const alfhiCtx = buildDemoAuthContext("SUPER_ADMIN");
    expect(alfhiCtx.userName).toBe("Alfhi");
    expect(alfhiCtx.roles[0]?.mineId).toBeNull();

    const akshayCtx = buildDemoAuthContext("MINE_MANAGER");
    expect(akshayCtx.userName).toBe("Akshay");
    expect(akshayCtx.roles[0]?.mineId).toBe("a0000000-0000-0000-0000-000000000030");

    const koushikCtx = buildDemoAuthContext("CONTRACTOR");
    expect(koushikCtx.userName).toBe("Koushik");
    expect(koushikCtx.contractorId).toBe("a0000000-0000-0000-0000-000000000110");
  });
});
