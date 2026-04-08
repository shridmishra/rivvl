"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
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

function PasswordRequirements({ password }: { password: string }) {
  const hasStarted = password.length > 0;
  const results = PASSWORD_RULES.map((rule) => ({
    ...rule,
    met: rule.test(password),
  }));

  return (
    <div className="mt-2.5 space-y-1.5">
      <ul className="space-y-1">
        {results.map((rule) => (
          <li
            key={rule.key}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              rule.met
                ? "text-emerald-600"
                : hasStarted
                  ? "text-red-500"
                  : "text-slate-400"
            }`}
          >
            {rule.met ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*                        RESET PASSWORD FORM                             */
/* ═══════════════════════════════════════════════════════════════════════ */

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If no session, they shouldn't be here (or recovery link expired)
        setError("Your reset session has expired or is invalid. Please request a new password reset link.");
      }
      setCheckingAuth(false);
    });
  }, []);

  const passwordStrong = PASSWORD_RULES.every((r) => r.test(password));
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleReset(e: React.FormEvent) {
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
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/login?verified=true");
    }, 3000);
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-gray-300 bg-white p-8 shadow-lg dark:border-gray-600 dark:bg-[#1A1A2E]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-xl font-bold">Password Reset Successful</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been updated. Redirecting you to sign in...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 bg-mesh-gradient">
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
            Set new password
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Please enter your new password below.
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 rounded-2xl glass-morphism p-8 shadow-xl">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
              {error.includes("expired") && (
                <div className="mt-3">
                  <Link href="/forgot-password" className="font-bold underline">
                    Request new link
                  </Link>
                </div>
              )}
            </div>
          )}

          {!error?.includes("expired") && (
            <form onSubmit={handleReset} className="space-y-6">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  New Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-foreground"
                >
                  Confirm New Password
                </label>
                <div className="relative mt-1">
                  <input
                    id="confirmPassword"
                    type={showConfirmPw ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"
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
                    {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-black py-5 text-sm font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-all rounded-full"
                loading={loading}
                disabled={!passwordStrong || !passwordsMatch}
              >
                Reset Password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
