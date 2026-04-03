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
  { href: "/", label: "Home" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/homes", label: "Real Estate" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const isTransparent = pathname === "/";
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for theme toggle
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
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
      .catch(() => {})
      .finally(() => {
        setAuthReady(true);
      });

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

  /* ─── Theme toggle — Hidden on landing page ─── */
  function ThemeToggle() {
    if (!mounted || pathname === "/") return null;
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

  function LoggedOutButtons({ onClick, isTransparent }: { onClick?: () => void; isTransparent?: boolean }) {
    return (
      <>
        <Link
          href="/login"
          onClick={onClick}
          className={`inline-flex items-center justify-center rounded-none hover:rounded-full transition-all duration-500 ease-in-out ${isTransparent ? "bg-black/80 text-white px-8 h-12" : "bg-primary text-primary-foreground px-5 py-2.5"} text-base font-medium hover:opacity-90 active:scale-[0.98] uppercase tracking-widest`}
        >
          Login
        </Link>
      </>
    );
  }

  function UserMenu({ onClose }: { onClose?: () => void }) {
    return (
      <>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {displayName}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
        <button
          onClick={() => {
            onClose?.();
            handleSignOut();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </>
    );
  }

  return (
    <header className={`${isTransparent ? "absolute top-0 bg-transparent border-none shadow-none" : "sticky top-0 bg-background border-b border-border shadow-sm"} z-50 w-full`}>
      <div className="mx-auto flex h-24 max-w-8xl items-center justify-between px-4 sm:px-6 lg:px-24">
        <Link href="/" className="flex items-center gap-2">
          {isTransparent ? (
            <Image
              src="/images/rivvl-logo-white.png"
              alt="rivvl.ai"
              width={140}
              height={45}
              className="h-8 w-auto brightness-0 invert"
              priority
            />
          ) : (
            <>
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
            </>
          )}
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative text-lg font-medium transition-colors hover:opacity-100 ${
                isTransparent 
                  ? "text-white" 
                  : (pathname === link.href || pathname.startsWith(link.href + "/"))
                    ? "text-primary"
                    : "text-foreground/70"
              }`}
            >
              <div className="relative h-[1.5em] overflow-hidden">
                <div className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-full">
                  <span>{link.label}</span>
                  <span className="absolute top-full">{link.label}</span>
                </div>
              </div>
              <span className={`absolute -bottom-1 left-0 h-[1.25px] w-full origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:scale-x-100 ${isTransparent ? "bg-white" : "bg-primary"}`} />
            </Link>
          ))}
        </nav>

        {/* Desktop right buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {authReady && user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`flex items-center gap-2 rounded-full border ${isTransparent ? "border-white/30 text-white" : "border-border text-foreground/80"} px-3 py-1.5 text-sm font-bold transition-all hover:bg-white/10 active:scale-[0.98]`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <span className="max-w-[120px] truncate leading-none">
                  {profileName ||
                    user.user_metadata?.full_name ||
                    user.email?.split("@")[0]}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-card py-1.5 shadow-xl animate-fade-in">
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <LoggedOutButtons isTransparent={isTransparent} />
          )}
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className={isTransparent ? "text-white" : "text-foreground/80"}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card">
              <div className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors hover:text-primary ${
                      pathname === link.href
                        ? "text-primary"
                        : "text-foreground/70"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="my-2 border-border" />

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
