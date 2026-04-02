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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 bg-background">
      {/* Client component for payment success toast + manage subscription */}
      <DashboardClient
        hasSubscription={hasSubscription}
        hasStripeCustomer={hasStripeCustomer}
      />

      {/* Payment failed banner */}
      {paymentFailed && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
          <div>
            <p className="text-sm font-bold text-error">
              Your last payment didn&apos;t go through.
            </p>
            <p className="mt-0.5 text-xs text-error/80 font-medium">
              Please try again or <a href="mailto:support@rivvl.io" className="font-bold underline hover:text-error/60">contact support</a>.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-base text-muted-foreground font-medium">
            Welcome back, {profile?.full_name || user.email}
          </p>
        </div>
        {planTier === "free" && (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <Crown className="h-4 w-4" />
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isPro10 ? (
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-warning" />}
            label="Pro 10 Reports Remaining"
            value={`${pro10Credits} of 10`}
          />
        ) : (
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-primary" />}
            label="Total Reports Generated"
            value={String(totalReportsGenerated)}
          />
        )}
        <StatCard
          icon={<FileText className="h-5 w-5 text-primary" />}
          label="Saved Reports"
          value={String(reports.length + homeReports.length)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-primary" />}
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
        <div className="mt-8 rounded-xl border border-warning/20 bg-warning/10 p-5">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 h-6 w-6 text-warning" />
            <div>
              <p className="text-base font-bold text-foreground">
                You&apos;ve used all 10 Pro reports
              </p>
              <p className="mt-1 text-sm text-muted-foreground font-medium">
                Purchase another plan to continue generating reports.{" "}
                <a href="/pricing" className="font-bold text-primary underline hover:text-primary/70">View plans</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Saved Reports — Client component for delete/rename */}
      <ReportsList initialReports={reports} initialHomeReports={homeReports} />

      {/* Account Settings */}
      <div className="mt-16" id="settings">
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Account Settings</h2>
        <AccountSettings
          email={user.email || ""}
          fullName={profile?.full_name || ""}
          planLabel={isPro10 ? `Pro 10 (${pro10Credits} reports remaining)` : planInfo.label}
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/20">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-foreground">{value}</p>
    </div>
  );
}
