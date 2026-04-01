"use client";

import { useState } from "react";
import { Pencil, Check, X, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccountSettingsProps {
  email: string;
  fullName: string;
  planLabel: string;
  planBadge: string;
  authProvider: string;
}

export function AccountSettings({
  email,
  fullName,
  planLabel,
  planBadge,
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
    <div className="mt-4 rounded-xl border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-[#1A1A2E]">
      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            <X className="inline h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {nameSuccess && (
        <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Name updated successfully.
        </div>
      )}

      {passwordSuccess && (
        <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
          Password updated successfully.
        </div>
      )}

      {emailMessage && (
        <div className="mb-4 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{emailMessage}</p>
          </div>
        </div>
      )}

      <dl className="space-y-5">
        {/* Name — editable for everyone */}
        <div className="flex items-center justify-between">
          <dt className="text-sm text-muted-foreground">Name</dt>
          <dd className="flex items-center gap-2">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={100}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#1E1E30] dark:text-gray-100"
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
                  className="h-8 w-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setNameValue(currentName);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:text-gray-500 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium">
                  {currentName || "\u2014"}
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                  title="Edit name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </dd>
        </div>

        {/* Email — read-only for OAuth, editable for email/password */}
        <div>
          <div className="flex items-center justify-between">
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="flex items-center gap-2">
              {isOAuth ? (
                <span className="text-sm font-medium">{email}</span>
              ) : editingEmail ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    placeholder="New email address"
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#1E1E30] dark:text-gray-100"
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
                    className="h-8 w-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <button
                    onClick={() => {
                      setEditingEmail(false);
                      setEmailValue("");
                    }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:text-gray-500 dark:hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium">{email}</span>
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-500 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                    title="Change email"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </dd>
          </div>
          {isOAuth && (
            <p className="mt-1 text-xs text-slate-400 dark:text-gray-500 text-right">
              Email is managed by your {providerLabel} account
            </p>
          )}
        </div>

        {/* Password — only for email/password users */}
        {!isOAuth && (
          <div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted-foreground">Password</dt>
              <dd>
                {!showPasswordSection ? (
                  <button
                    onClick={() => setShowPasswordSection(true)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
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
                    className="text-sm text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                )}
              </dd>
            </div>

            {showPasswordSection && (
              <div className="mt-3 space-y-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-slate-50 dark:bg-[#1E1E30] p-4">
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {passwordError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#1A1A2E] dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#1A1A2E] dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-[#1A1A2E] dark:text-gray-100"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") savePassword();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={savePassword}
                  loading={passwordSaving}
                  loadingText="Updating..."
                  disabled={!currentPassword || !newPassword || !confirmPassword}
                  className="w-full rounded-lg bg-indigo-600 py-2 font-semibold text-white hover:bg-indigo-700 transition-all"
                >
                  Update Password
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Plan */}
        <div className="flex items-center justify-between">
          <dt className="text-sm text-muted-foreground">Plan</dt>
          <dd>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadge}`}
            >
              {planLabel}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
