import Link from "next/link";

export const metadata = {
  title: "Terms of Service | rivvl",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Last updated: March 2026
        </p>

        <div className="mt-10 space-y-8 text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
          <p className="text-base font-medium">
            By using rivvl (&quot;the Service&quot;), you agree to these Terms of Service.
            Please read them carefully before using our platform.
          </p>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Service Description</h2>
            <p className="font-medium">
              rivvl provides intelligent comparison reports using publicly available data
              from various official sources. Our reports are intended to assist with purchase decisions 
              but should not be the sole basis for any transaction. We provide analysis, not legal or 
              financial advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Disclaimer</h2>
            <p className="font-medium">
              Reports are generated using intelligent analysis and publicly available data. While we strive
              for accuracy, we do not guarantee the completeness or accuracy of all information.
              We strongly recommend obtaining professional inspections before finalising any purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Payments and Refunds</h2>
            <p className="font-medium">
              Payments are processed securely through Stripe. Paid reports are delivered
              immediately upon payment. If you encounter issues with delivery, please contact 
              us through our contact page for immediate assistance.
            </p>
          </section>

          <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-black dark:text-white mb-4">Contact</h2>
            <p className="font-medium">
              For questions about these terms, please contact us at{" "}
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
