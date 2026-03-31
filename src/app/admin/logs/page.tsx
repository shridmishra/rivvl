import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ file?: string }>;
}) {
  // Auth check
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!user || !adminEmail || user.email !== adminEmail) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const crashDir = path.join(process.cwd(), "crash-reports");
  let files: string[] = [];
  let selectedContent = "";

  try {
    if (fs.existsSync(crashDir)) {
      files = fs.readdirSync(crashDir)
        .filter((f) => f.endsWith(".log"))
        .sort()
        .reverse();
    }
  } catch {
    // Directory read failed
  }

  if (params.file && files.includes(params.file)) {
    try {
      selectedContent = fs.readFileSync(path.join(crashDir, params.file), "utf-8");
    } catch {
      selectedContent = "Error reading file";
    }
  }

  const entries = selectedContent
    ? selectedContent
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        })
    : [];

  const severityColor: Record<string, string> = {
    ERROR: "bg-red-100 text-red-800",
    WARN: "bg-amber-100 text-amber-800",
    CRASH: "bg-red-200 text-red-900",
    API_FAIL: "bg-orange-100 text-orange-800",
    PAYMENT_FAIL: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Crash Reports</h1>
      <p className="mt-1 text-sm text-gray-500">Admin-only log viewer</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        {/* File list */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Log Files</h2>
          {files.length === 0 ? (
            <p className="text-xs text-gray-400">No log files found</p>
          ) : (
            <div className="space-y-1">
              {files.map((f) => (
                <a
                  key={f}
                  href={`/admin/logs?file=${f}`}
                  className={`block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    params.file === f
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {f}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Log content */}
        <div className="lg:col-span-3">
          {params.file ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {params.file} ({entries.length} entries)
              </h2>
              {entries.map((entry, i) => (
                <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1A2E] p-3 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${severityColor[entry.severity] || "bg-gray-100 text-gray-600"}`}>
                      {entry.severity || "UNKNOWN"}
                    </span>
                    <span className="text-gray-400">{entry.timestamp}</span>
                    <span className="text-gray-500 font-medium">{entry.location}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{entry.message || entry.raw}</p>
                  {entry.context && (
                    <pre className="mt-1 text-[10px] text-gray-400 overflow-x-auto">{JSON.stringify(entry.context, null, 2)}</pre>
                  )}
                  {entry.stack && (
                    <details className="mt-1">
                      <summary className="text-[10px] text-gray-400 cursor-pointer">Stack trace</summary>
                      <pre className="mt-1 text-[10px] text-gray-400 overflow-x-auto whitespace-pre-wrap">{entry.stack}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select a log file to view its contents</p>
          )}
        </div>
      </div>
    </div>
  );
}
