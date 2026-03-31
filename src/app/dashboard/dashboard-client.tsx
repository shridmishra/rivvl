"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, X } from "lucide-react";

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  car_single: "Single Report",
  car_pro_report: "Pro Report",
  car_pro10: "Pro 10",
  home_standard: "Real Estate Standard",
  home_premium: "Real Estate Premium",
  home_pro10: "Real Estate Pro 10",
};

interface DashboardClientProps {
  hasSubscription: boolean;
  hasStripeCustomer: boolean;
}

export function DashboardClient({
  hasSubscription,
  hasStripeCustomer,
}: DashboardClientProps) {
  const searchParams = useSearchParams();

  const paymentStatus = searchParams.get("payment");
  const planParam = searchParams.get("plan");

  const [showSuccess, setShowSuccess] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (paymentStatus === "success") {
      setShowSuccess(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      url.searchParams.delete("plan");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [paymentStatus]);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setPortalLoading(false);
    }
  }

  const planName = planParam
    ? PLAN_NAMES[planParam] || planParam
    : "";

  const successMessage = planName
    ? `Payment successful! Your ${planName} plan is now active.`
    : "Payment successful!";

  return (
    <>
      {showSuccess && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-700 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {successMessage}
            </p>
          </div>
          <button onClick={() => setShowSuccess(false)}>
            <X className="h-4 w-4 text-emerald-600" />
          </button>
        </div>
      )}

      {hasSubscription && hasStripeCustomer && (
        <div className="mt-6">
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-indigo-600 transition-all hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 dark:border-gray-600 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Manage Subscription
          </button>
        </div>
      )}
    </>
  );
}
