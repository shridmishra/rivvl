import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center bg-mesh-gradient text-foreground">
      <div className="glass-morphism p-12 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <FileQuestion className="h-12 w-12 text-black/40 dark:text-white/40" />
        </div>
        <h1 className="mt-8 text-4xl font-black tracking-tight text-black dark:text-white">
          404
        </h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 font-medium">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-4 text-sm font-bold text-white shadow-xl hover:opacity-90 transition-all dark:bg-white dark:text-black"
          >
            Back to Home
          </Link>
          <Link
            href="/compare"
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white/50 px-6 py-4 text-sm font-bold text-black hover:bg-zinc-50 transition-all dark:border-zinc-800 dark:bg-black/50 dark:text-white dark:hover:bg-zinc-900"
          >
            Compare Vehicles
          </Link>
        </div>
      </div>
    </div>
  );
}
