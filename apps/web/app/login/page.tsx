"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus, LogIn, CheckCircle2 } from "lucide-react";
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
  const { enterDemoWorkspace, reload } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [demoRole, setRole] = React.useState<RoleKey>("SUPER_ADMIN");
  const [submitting, setSubmitting] = React.useState(false);
  const [googleSubmitting, setGoogleSubmitting] = React.useState(false);
  const [demoSubmitting, setDemoSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccessMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || email.split("@")[0],
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        // Direct session without email verification
        reload();
        router.replace("/dashboard");
      } else {
        // Email confirmation is required
        setSuccessMessage("Account created successfully. Please check your email to verify your account.");
      }
    } catch {
      setError("Sign-up is unavailable. Check that Supabase environment variables are configured.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    if (googleSubmitting) return;
    setGoogleSubmitting(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setGoogleSubmitting(false);
      }
    } catch {
      setError("Google sign-in is currently unavailable.");
      setGoogleSubmitting(false);
    }
  }

  async function handleDemoEntry() {
    if (demoSubmitting) return;
    setDemoSubmitting(true);
    setError(null);
    try {
      const ok = await enterDemoWorkspace(demoRole);
      if (ok) {
        router.replace("/dashboard");
      }
    } catch {
      setError("Unable to enter demo workspace.");
    } finally {
      setDemoSubmitting(false);
    }
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

        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="relative h-20 w-20 overflow-hidden drop-shadow-md">
            <Image
              src="/branding/coalguard-logo.png"
              alt="CoalGuard AI Official Brand Logo"
              width={80}
              height={80}
              priority
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">
              CoalGuard <span className="text-amber-500">AI</span>
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5 tracking-wide uppercase">
              Safer Mines — Smarter Governance
            </p>
            <p className="text-[11px] font-medium text-primary/80 mt-1">
              Ministry of Coal / Coal India Limited
            </p>
          </div>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {mode === "signin" ? t("sign_in") : "Create Account"}
              </CardTitle>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                {mode === "signin" ? "Need an account?" : "Already registered?"}
              </button>
            </div>
            <CardDescription className="text-xs">
              {mode === "signin"
                ? "Authenticate using statutory credentials or Google OAuth."
                : "Register a new regulatory user account with CoalGuard."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("email_label")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t("password_label")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error ? (
                  <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="w-full font-semibold shadow-sm" disabled={submitting}>
                  <LogIn className="mr-1.5 h-4 w-4" />
                  {submitting ? t("signing_in") : t("sign_in")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="e.g. Inspector Ramesh"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">{t("email_label")}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@organization.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">{t("password_label")}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error ? (
                  <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </p>
                ) : null}

                {successMessage ? (
                  <div role="status" className="flex items-start gap-2 rounded-md bg-success/10 p-2.5 text-xs text-success">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                ) : null}

                <Button type="submit" className="w-full font-semibold shadow-sm" disabled={submitting}>
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  {submitting ? "Creating Account…" : "Create Account"}
                </Button>
              </form>
            )}

            {/* Google OAuth Option */}
            <div className="space-y-2">
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-border" />
                <span className="relative bg-card px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  or
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full font-medium text-xs flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={googleSubmitting}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                {googleSubmitting ? "Connecting to Google…" : "Continue with Google"}
              </Button>
            </div>

            {/* SIH Demo Mode Section */}
            {DEMO_MODE ? (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
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

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-xs font-medium"
                  onClick={handleDemoEntry}
                  disabled={demoSubmitting}
                >
                  {demoSubmitting ? "Entering Workspace…" : t("enter_demo_workspace")}
                </Button>

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

