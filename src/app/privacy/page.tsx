import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | rivvl",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-mesh-gradient py-20 px-4">
      <div className="max-w-3xl mx-auto glass-morphism p-8 sm:p-12 rounded-[2rem] shadow-xl">
        <Link
          href="/"
          className="text-sm font-bold text-black dark:text-white hover:underline"
        >
          &larr; Back to Home
        </Link>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-black dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Last updated: March 2026
        </p>
        
        <div className="mt-10 space-y-8 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
          <p className="text-base font-medium">
            rivvl (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, and safeguard your information
            when you use our intelligent comparison service.
          </p>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>Account information (email address) when you sign up</li>
              <li>Vehicle/Property listing URLs and manual entries you submit for comparison</li>
              <li>Payment information processed securely through Stripe (we do not store card details)</li>
              <li>Usage data such as reports generated and features used</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 font-medium">
              <li>To generate intelligent comparison reports</li>
              <li>To process payments and manage your account</li>
              <li>To improve our service and user experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Data Sources</h2>
            <p className="font-medium">
              Our reports use publicly available data from official sources (NHTSA, EPA, local property records), 
              and proprietary intelligent analysis. We do not access private records or unauthorized data.
            </p>
          </section>

          <section className="pt-8 border-t border-border dark:border-zinc-800">
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Contact</h2>
            <p className="font-medium">
              For privacy-related questions, please contact us at{" "}
              <Link href="/contact" className="text-black dark:text-white font-bold hover:underline">
                our contact page
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
