import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md">
        {/* Large 404 */}
        <p className="text-8xl font-extrabold gradient-text">404</p>

        {/* Message */}
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Page not found
        </h1>
        <p className="mt-3 text-base text-slate-600 dark:text-gray-400">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="gradient-bg inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-[#1A1A2E] px-6 py-3 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-[#1E1E30] transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
