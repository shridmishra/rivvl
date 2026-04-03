"use client";

import { useState } from "react";
import { Pencil, Check, X, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccountSettingsProps {
  email: string;
  fullName: string;
  planLabel: string;
  authProvider: string;
}

export function AccountSettings({
  email,
  fullName,
  planLabel,
  authProvider,
}: AccountSettingsProps) {
  const isOAuth = authProvider !== "email";

  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameValue, setNameValue] = useState(fullName);
  const [emailValue, setEmailValue] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentName, setCurrentName] = useState(fullName);

  // Password change state (only for email/password users)
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  async function saveName() {
    setNameSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: nameValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setCurrentName(nameValue);
      setEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
      window.dispatchEvent(
        new CustomEvent("rivvl:profile-updated", {
          detail: { full_name: nameValue },
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setNameSaving(false);
    }
  }

  async function saveEmail() {
    if (!emailValue || emailValue === email) return;
    setEmailSaving(true);
    setError(null);
    setEmailMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setEmailMessage(
        data.message ||
          `Verification email sent to ${emailValue}. Click the link to confirm the change.`
      );
      setEditingEmail(false);
      setEmailValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setEmailSaving(false);
    }
  }

  async function savePassword() {
    setPasswordError(null);
    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, current_password: currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to update password"
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  const providerLabel =
    authProvider === "google"
      ? "Google"
      : authProvider.charAt(0).toUpperCase() + authProvider.slice(1);

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
      {error && (
        <div className="mb-6 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <p className="font-bold">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-error/60 hover:text-error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {nameSuccess && (
        <div className="mb-6 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success font-bold">
          Name updated successfully.
        </div>
      )}

      {passwordSuccess && (
        <div className="mb-6 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success font-bold">
          Password updated successfully.
        </div>
      )}

      {emailMessage && (
        <div className="mb-6 rounded-2xl border border-black/10 bg-neutral-100 dark:bg-neutral-800 px-6 py-5 text-sm text-black dark:text-white">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
            <p className="font-bold">{emailMessage}</p>
          </div>
        </div>
      )}

      <dl className="space-y-8">
        {/* Name — editable for everyone */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Name</dt>
          <dd className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={100}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameValue(currentName);
                    }
                  }}
                />
                <Button
                  onClick={saveName}
                  loading={nameSaving}
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 transition-all active:scale-[0.98]"
                >
                  <Check className="h-5 w-5" />
                </Button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameValue(currentName);
                  }}
                  className="rounded-xl p-2.5 text-muted-foreground hover:bg-secondary/20 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-foreground">
                  {currentName || "\u2014"}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-all"
                  title="Edit name"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </dd>
        </div>

        {/* Email — read-only for OAuth, editable for email/password */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email</dt>
            <dd className="flex items-center gap-2">
              {isOAuth ? (
                <span className="text-base font-bold text-foreground">{email}</span>
              ) : editingEmail ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="New email address"
                    className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEmail();
                      if (e.key === "Escape") {
                        setEditingEmail(false);
                        setEmailValue("");
                      }
                    }}
                  />
                  <Button
                    onClick={saveEmail}
                    loading={emailSaving}
                    loadingText="Saving..."
                    disabled={!emailValue}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-black text-white dark:bg-white dark:text-black hover:bg-neutral-800 transition-all active:scale-[0.98]"
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                  <button
                    onClick={() => {
                      setEditingEmail(false);
                      setEmailValue("");
                    }}
                    className="rounded-xl p-2.5 text-muted-foreground hover:bg-secondary/20 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-foreground">{email}</span>
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-all"
                    title="Change email"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
            </dd>
          </div>
          {isOAuth && (
            <p className="mt-2 text-xs font-bold text-muted-foreground/60 text-right">
              Managed by {providerLabel} account
            </p>
          )}
        </div>

        {/* Password — only for email/password users */}
        {!isOAuth && (
          <div className="border-t border-border pt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Password</dt>
              <dd>
                {!showPasswordSection ? (
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className="text-sm font-bold text-black dark:text-white underline hover:opacity-70 transition-all"
                  >
                    Change Password
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowPasswordSection(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setPasswordError(null);
                    }}
                    className="text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
                  >
                    Cancel
                  </button>
                )}
              </dd>
            </div>

            {showPasswordSection && (
              <div className="mt-6 space-y-5 rounded-2xl border border-border bg-secondary/5 p-6 transition-all">
                {passwordError && (
                  <p className="text-sm font-bold text-error">
                    {passwordError}
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {showCurrentPw ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 chars"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {showNewPw ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Confirm New
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") savePassword();
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                      >
                        {showConfirmPw ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={savePassword}
                  loading={passwordSaving}
                  loadingText="Updating..."
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                  className="w-full h-12 rounded-xl bg-primary font-bold text-white hover:bg-primary/90 transition-all active:scale-[0.98]"
                >
                  Update Password
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Plan — strictly read-only badge */}
        <div className="border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <dt className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Plan</dt>
            <dd>
              <span
                className={`inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-4 py-1.5 text-[10px] font-bold text-black dark:text-white uppercase tracking-widest border border-black/5 dark:border-white/5 shadow-sm`}
              >
                {planLabel}
              </span>
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}
