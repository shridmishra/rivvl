import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | rivvl",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F0F1A]">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Link
          href="/"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          &larr; Back to Home
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-indigo-950 dark:text-gray-100">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">
          Last updated: March 2026
        </p>
        <div className="mt-8 prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-gray-300 space-y-4 text-sm leading-relaxed">
          <p>
            rivvl (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your information
            when you use our vehicle comparison service.
          </p>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account information (email address) when you sign up</li>
            <li>Vehicle listing URLs and manual vehicle entries you submit for comparison</li>
            <li>Payment information processed securely through Stripe (we do not store card details)</li>
            <li>Usage data such as reports generated and features used</li>
          </ul>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To generate vehicle comparison reports</li>
            <li>To process payments and manage your account</li>
            <li>To improve our service and user experience</li>
          </ul>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">Data Sources</h2>
          <p>
            Our reports use publicly available data from NHTSA (National Highway Traffic Safety
            Administration), EPA (Environmental Protection Agency), and intelligent analysis. We do not
            access private vehicle history records.
          </p>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">Contact</h2>
          <p>
            For privacy-related questions, please contact us at{" "}
            <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              our contact page
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
