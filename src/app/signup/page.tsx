"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/* ═══════════════════════════════════════════════════════════════════════ */
/*                     PASSWORD VALIDATION HELPERS                        */
/* ═══════════════════════════════════════════════════════════════════════ */

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { key: "upper", label: "At least one uppercase letter (A-Z)", test: (pw: string) => /[A-Z]/.test(pw) },
  { key: "lower", label: "At least one lowercase letter (a-z)", test: (pw: string) => /[a-z]/.test(pw) },
  { key: "number", label: "At least one number (0-9)", test: (pw: string) => /[0-9]/.test(pw) },
  { key: "special", label: "At least one special character (!@#$%^&*)", test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pw) },
] as const;

function getStrength(metCount: number): { level: number; label: string; color: string } {
  if (metCount <= 2) return { level: 1, label: "Weak", color: "bg-red-500" };
  if (metCount === 3) return { level: 2, label: "Fair", color: "bg-orange-500" };
  if (metCount === 4) return { level: 3, label: "Good", color: "bg-yellow-500" };
  return { level: 4, label: "Strong", color: "bg-emerald-500" };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                         PASSWORD REQUIREMENTS                          */
/* ═══════════════════════════════════════════════════════════════════════ */

function PasswordRequirements({ password }: { password: string }) {
  const hasStarted = password.length > 0;
  const results = PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));
  const metCount = results.filter((r) => r.met).length;
  const strength = getStrength(metCount);

  return (
    <div className="mt-2.5 space-y-2.5">
      {/* Requirements checklist */}
      <ul className="space-y-1">
        {results.map((rule) => {
          const isMet = rule.met;
          const showRed = hasStarted && !isMet;
          return (
            <li
              key={rule.key}
              className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                isMet
                  ? "text-emerald-600"
                  : showRed
                    ? "text-red-500"
                    : "text-slate-400"
              }`}
            >
              {isMet ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              {rule.label}
            </li>
          );
        })}
      </ul>

      {/* Strength bar */}
      {hasStarted && (
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((seg) => (
              <div
                key={seg}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  seg <= strength.level ? strength.color : "bg-slate-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
          <span
            className={`text-xs font-semibold transition-colors duration-200 ${
              strength.level === 1
                ? "text-red-500"
                : strength.level === 2
                  ? "text-orange-500"
                  : strength.level === 3
                    ? "text-yellow-600"
                    : "text-emerald-600"
            }`}
          >
            {strength.label}
          </span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                           SIGNUP FORM                                  */
/* ═══════════════════════════════════════════════════════════════════════ */

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setCheckingAuth(false);
      }
    }).catch(() => {
      setCheckingAuth(false);
    });
  }, [router]);

  // Derived validation state (hooks must be called before any early returns)
  const metCount = useMemo(
    () => PASSWORD_RULES.filter((r) => r.test(password)).length,
    [password]
  );
  const passwordStrong = metCount >= 4;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const formValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordStrong &&
    passwordsMatch;

  if (checkingAuth) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordStrong) {
      setError("Please meet all password requirements.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-300 bg-white p-8 shadow-lg dark:border-gray-600 dark:bg-[#1A1A2E]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50">
              <svg
                className="h-8 w-8 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold">Check your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <strong>{email}</strong>. Click the
              link to verify your account and start comparing cars.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Didn&apos;t get the email? Check your spam folder.
            </p>
            <Link
              href={`/login${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/images/rivvl-logo-black.png"
              alt="rivvl.ai"
              width={150}
              height={50}
              className="h-10 w-auto dark:hidden"
              priority
            />
            <Image
              src="/images/rivvl-logo-white.png"
              alt="rivvl.ai"
              width={150}
              height={50}
              className="hidden h-10 w-auto dark:block"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-gray-100">
            Create your account
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Start comparing cars with intelligent insights
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl border border-gray-300 bg-white p-8 shadow-lg dark:border-gray-600 dark:bg-[#1A1A2E] dark:shadow-gray-900/50">
          {/* Google OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-3 py-5 text-sm font-medium dark:border-gray-600 dark:bg-[#1E1E30] dark:text-gray-200 dark:hover:bg-[#25253A]"
            onClick={handleGoogleLogin}
            loading={googleLoading}
            disabled={loading}
          >
            {!googleLoading && (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground dark:bg-[#1A1A2E]">
                or sign up with email
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-foreground"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            {/* Password with requirements */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <PasswordRequirements password={password} />
            </div>

            {/* Confirm password with match indicator */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  type={showConfirmPw ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {/* Match feedback */}
              {confirmPassword.length > 0 && (
                <div
                  className={`mt-1.5 flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                    passwordsMatch ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {passwordsMatch ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords don\u2019t match"}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gradient-bg py-5 text-sm font-semibold text-white hover:opacity-90 transition-all"
              loading={loading}
              loadingText="Creating account..."
              disabled={googleLoading || !formValid}
            >
              Create Account
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/login${redirectTo !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
