import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  getTranslation,
  type Locale,
  type TranslationKey,
} from "@sih/config";
import { NAMED_DEMO_ACCOUNTS, buildDemoAuthContext } from "../lib/auth/demo";

describe("Language Support (i18n) — English, Hindi, Telugu", () => {
  it("supports exactly en, hi, and te with valid labels", () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("hi");
    expect(codes).toContain("te");
    expect(SUPPORTED_LOCALES.length).toBe(3);
  });

  it("has translations for all required navigation and role keys in en, hi, and te", () => {
    const requiredKeys: TranslationKey[] = [
      "nav_dashboard",
      "nav_mines",
      "nav_compliance",
      "nav_inspections",
      "nav_corrective_actions",
      "nav_incidents",
      "nav_contractors",
      "nav_reports",
      "nav_assistant",
      "role_super_admin",
      "role_corporate_admin",
      "role_mine_manager",
      "role_inspector",
      "role_contractor",
      "role_regulator",
      "field_workspace",
      "sync_status",
      "btn_sync",
    ];

    const locales: Locale[] = ["en", "hi", "te"];
    for (const loc of locales) {
      for (const key of requiredKeys) {
        const val = getTranslation(key, loc);
        expect(val).toBeDefined();
        expect(val.length).toBeGreaterThan(0);
        expect(val).toBe(TRANSLATIONS[loc][key]);
      }
    }
  });

  it("provides distinct native language labels for Hindi and Telugu", () => {
    expect(getTranslation("nav_dashboard", "en")).toBe("Dashboard");
    expect(getTranslation("nav_dashboard", "hi")).toBe("डैशबोर्ड");
    expect(getTranslation("nav_dashboard", "te")).toBe("డాష్‌బోర్డ్");

    expect(getTranslation("role_mine_manager", "en")).toBe("Mine Manager");
    expect(getTranslation("role_mine_manager", "hi")).toBe("खदान प्रबंधक");
    expect(getTranslation("role_mine_manager", "te")).toBe("గని మేనేజర్");
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
