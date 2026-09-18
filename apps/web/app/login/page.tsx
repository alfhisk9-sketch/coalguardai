"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { RoleKey } from "@sih/config";
import { ROLE_KEYS } from "@sih/config";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";
import { DEMO_MODE, NAMED_DEMO_ACCOUNTS } from "../../lib/auth/demo";
import { useAuth } from "../../lib/auth/provider";
import { useI18n } from "../../lib/i18n";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select } from "../../components/ui/select";
import { LanguageSelector } from "../../components/shell/language-selector";
import { CoalGuardIcon } from "../../components/shell/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const { setDemoRole, reload } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [demoRole, setRole] = React.useState<RoleKey>("SUPER_ADMIN");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      reload();
      router.replace("/dashboard");
    } catch {
      setError("Sign-in is unavailable. Check that Supabase environment variables are configured.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDemoEntry() {
    setDemoRole(demoRole);
    router.replace("/dashboard");
  }

  function handleQuickFill(role: RoleKey) {
    setRole(role);
    const persona = NAMED_DEMO_ACCOUNTS[role];
    if (persona) {
      setEmail(persona.email);
      setPassword("demo123");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Language selector centered at top of login */}
        <div className="mb-4 flex justify-center">
          <LanguageSelector />
        </div>

        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <CoalGuardIcon className="h-12 w-12 drop-shadow-md" ariaHidden={false} />
          <h1 className="text-lg font-bold tracking-tight text-foreground">{t("app_title")}</h1>
          <p className="text-xs text-muted-foreground">{t("app_subtitle")}</p>
          <p className="text-[11px] font-semibold text-primary">{t("ministry_label")}</p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader>
            <CardTitle>{t("sign_in")}</CardTitle>
            <CardDescription>{t("login_card_desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-3" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email_label")}</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("password_label")}</Label>
                <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error ? (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full font-semibold shadow-sm" disabled={submitting}>
                {submitting ? t("signing_in") : t("sign_in")}
              </Button>
            </form>

            {DEMO_MODE ? (
              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  <span>{t("demo_mode_badge")}</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="demo-role-select" className="text-xs font-medium">
                    {t("explore_as_role")}
                  </Label>
                  <Select
                    id="demo-role-select"
                    value={demoRole}
                    onChange={(e) => {
                      const r = e.target.value as RoleKey;
                      setRole(r);
                      handleQuickFill(r);
                    }}
                  >
                    {ROLE_KEYS.map((r) => {
                      const p = NAMED_DEMO_ACCOUNTS[r];
                      return (
                        <option key={r} value={r}>
                          {p.name} — {p.roleLabel}
                        </option>
                      );
                    })}
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="w-full text-xs font-medium" onClick={handleDemoEntry}>
                    {t("enter_demo_workspace")}
                  </Button>
                </div>

                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  {t("demo_disclaimer")}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-muted-foreground">
          {t("demo_sih_note")}
        </p>
      </div>
    </main>
  );
}
