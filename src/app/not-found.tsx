import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center bg-background text-foreground">
      <div className="mx-auto max-w-md">
        {/* Large 404 */}
        <p className="text-8xl font-extrabold text-primary">404</p>

        {/* Message */}
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-base text-muted-foreground font-medium">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-6 py-3 text-sm font-bold text-foreground/80 hover:bg-secondary/20 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
