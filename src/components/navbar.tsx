"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, LogOut, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const navLinks = [
  { href: "/vehicles", label: "Vehicles" },
  { href: "/homes", label: "Real Estate" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for theme toggle
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session — with error handling so buttons always appear
    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        // Fetch profile name from profiles table
        if (user) {
          supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single()
            .then(({ data }) => {
              if (data?.full_name) setProfileName(data.full_name);
            });
        }
      })
      .catch(() => {
        // Auth failed — show logged-out state
      })
      .finally(() => {
        setAuthReady(true);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single()
          .then(({ data }) => {
            if (data?.full_name) setProfileName(data.full_name);
          });
      } else {
        setProfileName(null);
      }
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for profile name updates from Account Settings
  useEffect(() => {
    function handleProfileUpdate(e: CustomEvent<{ full_name: string }>) {
      setProfileName(e.detail.full_name);
    }
    window.addEventListener(
      "rivvl:profile-updated",
      handleProfileUpdate as EventListener
    );
    return () =>
      window.removeEventListener(
        "rivvl:profile-updated",
        handleProfileUpdate as EventListener
      );
  }, []);

  // Use profile name (from profiles table) first, then fall back to user_metadata, then email
  const displayName =
    profileName || user?.user_metadata?.full_name || user?.email;

  const initials = profileName
    ? profileName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.user_metadata?.full_name
      ? user.user_metadata.full_name
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : user?.email?.charAt(0).toUpperCase() ?? "U";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfileName(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  /* ─── Theme toggle ─── */
  function ThemeToggle() {
    if (!mounted) return <div className="h-9 w-9" />;
    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-slate-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        aria-label="Toggle dark mode"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    );
  }

  /* ─── Shared button fragments ─── */
  function LoggedOutButtons({ onClick }: { onClick?: () => void }) {
    return (
      <>
        <Button
          variant="ghost"
          className="text-slate-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
          asChild
        >
          <Link href="/login" onClick={onClick}>
            Log in
          </Link>
        </Button>
        <Link
          href="/vehicles"
          onClick={onClick}
          className="gradient-bg-hover inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          Get Started
        </Link>
      </>
    );
  }

  function UserMenu({ onClose }: { onClose?: () => void }) {
    return (
      <>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-bg text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium dark:text-gray-200">
              {displayName}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <button
          onClick={() => {
            onClose?.();
            handleSignOut();
          }}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm dark:bg-[#0F0F1A] dark:shadow-gray-800/30 border-b border-[#E5E5F0]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/rivvl-logo-black.png"
            alt="rivvl.ai"
            width={120}
            height={40}
            className="h-8 w-auto dark:hidden"
            priority
          />
          <Image
            src="/images/rivvl-logo-white.png"
            alt="rivvl.ai"
            width={120}
            height={40}
            className="hidden h-8 w-auto dark:block"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-700 dark:text-gray-300"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right buttons — ALWAYS visible, no skeleton */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {authReady && user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-600 dark:text-gray-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-bg text-xs font-bold text-white">
                  {initials}
                </div>
                <span className="max-w-[120px] truncate">
                  {profileName ||
                    user.user_metadata?.full_name ||
                    user.email?.split("@")[0]}
                </span>
              </button>

              {/* Dropdown menu */}
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-300 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-[#1A1A2E]">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <LoggedOutButtons />
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="dark:text-gray-300">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 dark:bg-[#1A1A2E]">
              <div className="mt-6 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${
                      pathname === link.href
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-700 dark:text-gray-300"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 dark:border-gray-700" />

                {/* Always show buttons — logged-out is the default */}
                {authReady && user ? (
                  <UserMenu onClose={() => setOpen(false)} />
                ) : (
                  <LoggedOutButtons onClick={() => setOpen(false)} />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
