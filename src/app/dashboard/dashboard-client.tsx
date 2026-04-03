"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <div className="mb-8 flex items-center justify-between rounded-xl border border-success/20 bg-success/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <p className="text-sm font-bold text-success">
              {successMessage}
            </p>
          </div>
          <button onClick={() => setShowSuccess(false)} className="rounded-lg p-1.5 hover:bg-success/10 transition-colors">
            <X className="h-5 w-5 text-success/60 hover:text-success" />
          </button>
        </div>
      )}

      {hasSubscription && hasStripeCustomer && (
        <div className="mt-8">
          <Button
            onClick={openPortal}
            loading={portalLoading}
            loadingText="Opening..."
            variant="outline"
            className="h-12 rounded-full border border-border bg-background px-8 text-sm font-bold text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-sm"
          >
            {!portalLoading && <CreditCard className="h-4 w-4" />}
            Manage Billing
          </Button>
        </div>
      )}
    </>
  );
}
