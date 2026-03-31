import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Clock,
  FileText,
  Crown,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CONFIG, getEffectivePlanTier } from "@/lib/supabase/types";
import type { Profile, DbReport, HomeReport } from "@/lib/supabase/types";
import { DashboardClient } from "./dashboard-client";
import { AccountSettings } from "./account-settings";
import { ReportsList } from "./reports-list";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile, vehicle reports, and home reports in parallel
  const [profileResult, reportsResult, homeReportsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("home_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const profile = profileResult.data as Profile | null;
  const reports = (reportsResult.data as DbReport[] | null) ?? [];
  const homeReports = (homeReportsResult.data as HomeReport[] | null) ?? [];

  const vehiclePlanTier = (profile as unknown as Record<string, string>)?.vehicle_plan_tier ?? "free";
  const vehicleReportsUsed = (profile as unknown as Record<string, number>)?.vehicle_reports_used ?? 0;
  const vehicleMaxReports = (profile as unknown as Record<string, number>)?.vehicle_max_reports ?? 0;
  const homePlanTier = (profile as unknown as Record<string, string>)?.home_plan_tier ?? "free";
  const homeReportsUsed = (profile as unknown as Record<string, number>)?.home_reports_used ?? 0;
  const homeMaxReports = (profile as unknown as Record<string, number>)?.home_max_reports ?? 0;

  const effectiveVehiclePlan = getEffectivePlanTier(vehiclePlanTier, vehicleReportsUsed, vehicleMaxReports);
  const effectiveHomePlan = getEffectivePlanTier(homePlanTier, homeReportsUsed, homeMaxReports);

  // Display the "best" active plan for the badge
  const planTier = effectiveVehiclePlan !== "free" ? effectiveVehiclePlan : effectiveHomePlan;
  const planInfo = PLAN_CONFIG[planTier] ?? PLAN_CONFIG.free;
  const hasSubscription = false; // No more subscriptions
  const hasStripeCustomer = !!profile?.stripe_customer_id;
  const totalReportsGenerated = reports.length + homeReports.length;
  const paymentFailed = (profile as unknown as Record<string, unknown>)?.payment_failed === true;
  const isPro10 = vehiclePlanTier === "car_pro10" || homePlanTier === "home_pro10";
  const pro10Credits = vehiclePlanTier === "car_pro10" ? (vehicleMaxReports - vehicleReportsUsed) : homePlanTier === "home_pro10" ? (homeMaxReports - homeReportsUsed) : 0;

  // Detect auth provider (google, email, etc.)
  const authProvider =
    (user.app_metadata?.provider as string) || "email";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Client component for payment success toast + manage subscription */}
      <DashboardClient
        hasSubscription={hasSubscription}
        hasStripeCustomer={hasStripeCustomer}
      />

      {/* Payment failed banner */}
      {paymentFailed && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Your last payment didn&apos;t go through.
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              Please try again or <a href="mailto:support@rivvl.io" className="font-semibold underline">contact support</a>.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-gray-100">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Welcome back, {profile?.full_name || user.email}
          </p>
        </div>
        {planTier === "free" && (
          <Link
            href="/pricing"
            className="gradient-bg-hover inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Crown className="h-4 w-4" />
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isPro10 ? (
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-amber-500" />}
            label="Pro 10 Reports Remaining"
            value={`${pro10Credits} of 10`}
          />
        ) : (
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
            label="Total Reports Generated"
            value={String(totalReportsGenerated)}
          />
        )}
        <StatCard
          icon={<FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          label="Saved Reports"
          value={String(reports.length + homeReports.length)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
          label="Member Since"
          value={
            profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "-"
          }
        />
      </div>

      {/* Pro 10 credits exhausted alert */}
      {isPro10 && pro10Credits <= 0 && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                You&apos;ve used all 10 Pro reports
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Purchase another plan to continue generating reports.{" "}
                <a href="/pricing" className="font-semibold underline">View plans</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Alert (legacy — subscriptions removed) */}
      {false && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                You&apos;ve used all your reports
              </p>
              <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                Your reports will reset at the next billing cycle.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports — Client component for delete/rename */}
      <ReportsList initialReports={reports} initialHomeReports={homeReports} />

      {/* Account Settings */}
      <div className="mt-10" id="settings">
        <h2 className="text-xl font-semibold dark:text-gray-100">Account Settings</h2>
        <AccountSettings
          email={user.email || ""}
          fullName={profile?.full_name || ""}
          planLabel={isPro10 ? `Pro 10 (${pro10Credits} reports remaining)` : planInfo.label}
          planBadge={planInfo.badge}
          authProvider={authProvider}
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-6 dark:border-gray-600 dark:bg-[#1A1A2E]">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold dark:text-gray-100">{value}</p>
    </div>
  );
}
