"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  User, 
  Building2, 
  HardHat, 
  ClipboardCheck, 
  FileCheck2, 
  Briefcase 
} from "lucide-react";
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
import { LanguageSelector } from "../../components/shell/language-selector";

interface DemoRoleConfig {
  key: RoleKey;
  title: string;
  badge: string;
  scope: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_ROLES: DemoRoleConfig[] = [
  {
    key: "SUPER_ADMIN",
    title: "Administrator",
    badge: "Super Admin",
    scope: "Full Organization Oversight, Audit Logs & All Mines",
    icon: Building2,
  },
  {
    key: "MINE_MANAGER",
    title: "Mine Manager",
    badge: "Operations",
    scope: "Shakti Open Cast Operations, Shift Rosters & Production",
    icon: HardHat,
  },
  {
    key: "REGULATOR",
    title: "Safety Officer",
    badge: "DGMS / Safety",
    scope: "Statutory Safety Compliance, Environmental & Regulatory Returns",
    icon: FileCheck2,
  },
  {
    key: "INSPECTOR",
    title: "Inspector",
    badge: "Field Safety",
    scope: "Statutory Safety Walkthroughs & Hazard Observations",
    icon: ClipboardCheck,
  },
  {
    key: "CORPORATE_ADMIN",
    title: "Corporate Admin",
    badge: "Governance",
    scope: "Multi-Mine Compliance Health & Corporate Analytics",
    icon: Briefcase,
  },
  {
    key: "CONTRACTOR",
    title: "Contractor",
    badge: "Partner Scope",
    scope: "Alpha Mining Services Workforce Compliance & Biometrics",
    icon: User,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { reload } = useAuth();
  const { t } = useI18n();

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [googleSubmitting, setGoogleSubmitting] = React.useState(false);
  const [activeDemoSigning, setActiveDemoSigning] = React.useState<RoleKey | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setUnconfirmedEmail(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (signInError) {
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          setError("Your email address has not been confirmed yet. Please verify your email inbox or click 'Resend Confirmation Email' below.");
          setUnconfirmedEmail(email.trim());
        } else {
          setError(signInError.message);
        }
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
    setUnconfirmedEmail(null);

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
        reload();
        router.replace("/dashboard");
      } else {
        setSuccessMessage("Account created successfully! Please check your email inbox to confirm your account before signing in.");
        setUnconfirmedEmail(email.trim());
      }
    } catch {
      setError("Sign-up is unavailable. Check that Supabase environment variables are configured.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail || resending) return;
    setResending(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: unconfirmedEmail,
      });

      if (resendErr) {
        setError(resendErr.message);
      } else {
        setSuccessMessage(`Confirmation email resent to ${unconfirmedEmail}. Please check your inbox.`);
      }
    } catch {
      setError("Unable to resend confirmation email. Please check network connection.");
    } finally {
      setResending(false);
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
        if (oauthError.message.toLowerCase().includes("not enabled") || oauthError.message.toLowerCase().includes("unsupported")) {
          setError("Google OAuth is not enabled on this Supabase project. Please use statutory email/password or select a Demo Account below.");
        } else {
          setError(oauthError.message);
        }
        setGoogleSubmitting(false);
      }
    } catch {
      setError("Google sign-in is currently unavailable.");
      setGoogleSubmitting(false);
    }
  }

  async function handleInstantDemoLogin(role: RoleKey) {
    if (activeDemoSigning) return;
    setActiveDemoSigning(role);
    setError(null);
    setSuccessMessage(null);
    setUnconfirmedEmail(null);

    const persona = NAMED_DEMO_ACCOUNTS[role];
    if (!persona) {
      setError(`Unknown demo persona: ${role}`);
      setActiveDemoSigning(null);
      return;
    }

    // Populate inputs for visibility
    setEmail(persona.email);
    setPassword("demo123");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: persona.email,
        password: "demo123",
      });

      if (signInErr) {
        setError(`Demo sign-in failed: ${signInErr.message}`);
        return;
      }

      reload();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to authenticate demo session.");
    } finally {
      setActiveDemoSigning(null);
    }
  }

  function handleFillCredentials(role: RoleKey) {
    const persona = NAMED_DEMO_ACCOUNTS[role];
    if (persona) {
      setEmail(persona.email);
      setPassword("demo123");
      setError(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Language selector centered at top of login */}
        <div className="flex justify-center">
          <LanguageSelector />
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative h-20 w-20 overflow-hidden drop-shadow-lg">
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
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              CoalGuard <span className="text-amber-500">AI</span>
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5 tracking-wide uppercase">
              Safer Mines — Smarter Governance
            </p>
            <p className="text-[11px] font-medium text-amber-500/90 mt-1">
              Ministry of Coal / Coal India Limited
            </p>
          </div>
        </div>

        {/* Main Authentication Card */}
        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white font-bold">
                {mode === "signin" ? t("sign_in") : "Create Account"}
              </CardTitle>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setSuccessMessage(null);
                  setUnconfirmedEmail(null);
                }}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                {mode === "signin" ? "Need an account?" : "Already registered?"}
              </button>
            </div>
            <CardDescription className="text-xs text-slate-400">
              {mode === "signin"
                ? "Authenticate with statutory credentials or one-click demo access."
                : "Register a new regulatory user account with CoalGuard."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-slate-300 font-medium">
                    {t("email_label")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@organization.gov.in"
                    className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-slate-300 font-medium">
                    {t("password_label")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error ? (
                  <div role="alert" className="rounded-md border border-red-900/50 bg-red-950/40 p-3 text-xs text-red-300 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                    {unconfirmedEmail ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs bg-red-900/40 hover:bg-red-900/60 text-red-200 border border-red-800"
                        onClick={handleResendConfirmation}
                        disabled={resending}
                      >
                        <Mail className="mr-1.5 h-3.5 w-3.5" />
                        {resending ? "Resending Confirmation…" : "Resend Confirmation Email"}
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {successMessage ? (
                  <div role="status" className="flex items-start gap-2 rounded-md border border-emerald-900/50 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span className="leading-relaxed">{successMessage}</span>
                  </div>
                ) : null}

                <Button 
                  type="submit" 
                  className="w-full font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-colors" 
                  disabled={submitting}
                >
                  <LogIn className="mr-1.5 h-4 w-4" />
                  {submitting ? t("signing_in") : t("sign_in")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="fullname" className="text-xs text-slate-300 font-medium">Full Name</Label>
                  <Input
                    id="fullname"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="e.g. Inspector Ramesh"
                    className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-500"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className="text-xs text-slate-300 font-medium">{t("email_label")}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@organization.gov.in"
                    className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className="text-xs text-slate-300 font-medium">{t("password_label")}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Minimum 6 characters"
                    className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs text-slate-300 font-medium">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="Confirm password"
                    className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus-visible:ring-amber-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {error ? (
                  <p role="alert" className="rounded-md border border-red-900/50 bg-red-950/40 p-2.5 text-xs text-red-300">
                    {error}
                  </p>
                ) : null}

                {successMessage ? (
                  <div role="status" className="flex items-start gap-2 rounded-md border border-emerald-900/50 bg-emerald-950/40 p-2.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                ) : null}

                <Button 
                  type="submit" 
                  className="w-full font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-colors" 
                  disabled={submitting}
                >
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  {submitting ? "Creating Account…" : "Create Account"}
                </Button>
              </form>
            )}

            {/* Google OAuth Option */}
            <div className="space-y-2 pt-1">
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-800" />
                <span className="relative bg-slate-900 px-2 text-[10px] uppercase tracking-wider text-slate-500">
                  or
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full font-medium text-xs flex items-center justify-center gap-2 border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-200"
                onClick={handleGoogleSignIn}
                disabled={googleSubmitting}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
          </CardContent>
        </Card>

        {/* Role-Based Demo Accounts Section */}
        {DEMO_MODE ? (
          <Card className="border-amber-950/60 bg-gradient-to-b from-slate-900/90 to-slate-950/95 text-slate-100 shadow-xl border">
            <CardHeader className="pb-3 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <CardTitle className="text-sm font-bold text-white">
                    Demo Accounts
                  </CardTitle>
                </div>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                  Instant Access
                </span>
              </div>
              <CardDescription className="text-xs text-slate-400">
                Select a pre-configured statutory persona to sign in directly with live Supabase credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {DEMO_ROLES.map((roleCfg) => {
                  const persona = NAMED_DEMO_ACCOUNTS[roleCfg.key];
                  const Icon = roleCfg.icon;
                  const isCurrent = email === persona?.email;
                  const isSigning = activeDemoSigning === roleCfg.key;

                  return (
                    <div
                      key={roleCfg.key}
                      className={`group relative flex flex-col justify-between rounded-lg border p-2.5 transition-all text-left ${
                        isCurrent
                          ? "border-amber-500 bg-amber-500/10 shadow-sm"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span className="text-xs font-bold text-white">
                              {roleCfg.title}
                            </span>
                          </div>
                          <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-medium text-slate-300">
                            {roleCfg.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-300">
                          {persona?.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate" title={persona?.email}>
                          {persona?.email}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 leading-tight line-clamp-2">
                          {roleCfg.scope}
                        </p>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="flex-1 h-6 text-[10px] font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 shadow-xs"
                          onClick={() => handleInstantDemoLogin(roleCfg.key)}
                          disabled={activeDemoSigning !== null || submitting}
                        >
                          {isSigning ? "Signing In…" : "Instant Sign In"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-slate-400 hover:text-white px-2"
                          onClick={() => handleFillCredentials(roleCfg.key)}
                        >
                          Fill
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] leading-relaxed text-slate-500 pt-1 text-center">
                All demonstration personas are auto-confirmed with password <code className="text-slate-400 font-mono">demo123</code>.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <p className="text-center text-[10px] leading-relaxed text-slate-500">
          Smart India Hackathon (SIH26024) Prototype • Single Source of Truth: Supabase PostgreSQL
        </p>
      </div>
    </main>
  );
}


