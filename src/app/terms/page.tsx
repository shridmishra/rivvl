import Link from "next/link";

export const metadata = {
  title: "Terms of Service | rivvl",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-slate-500 dark:text-gray-400">
          Last updated: March 2026
        </p>
        <div className="mt-8 prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-gray-300 space-y-4 text-sm leading-relaxed">
          <p>
            By using rivvl (&quot;the Service&quot;), you agree to these Terms of Service.
            Please read them carefully.
          </p>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">Service Description</h2>
          <p>
            rivvl provides intelligent vehicle comparison reports using publicly available data
            from government sources (NHTSA, EPA) and vehicle listing websites. Our reports are
            intended to assist with vehicle purchase decisions but should not be the sole basis
            for any purchasing decision.
          </p>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">Disclaimer</h2>
          <p>
            Reports are generated using intelligent analysis and publicly available data. While we strive
            for accuracy, we do not guarantee the completeness or accuracy of all information.
            We strongly recommend obtaining a vehicle history report and professional inspection
            before purchasing any vehicle.
          </p>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">Payments and Refunds</h2>
          <p>
            Payments are processed securely through Stripe. Paid reports are delivered
            immediately upon payment. For refund requests, please contact us through our{" "}
            <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              contact page
            </Link>.
          </p>
          <h2 className="text-lg font-semibold text-indigo-950 dark:text-gray-100 mt-6">Contact</h2>
          <p>
            For questions about these terms, please contact us at{" "}
            <Link href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              our contact page
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
