import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — important for Server Components
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user) {
    // Redirect authenticated users away from login/signup pages
    if (pathname === "/login" || pathname === "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Self-healing: ensure a profile row exists for authenticated users.
    // The trigger may have failed during signup, so create a default profile
    // on the first authenticated request if missing.
    const protectedPrefixes = ["/dashboard", "/compare", "/report", "/homes/report", "/admin"];
    if (protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // Use service client to bypass RLS INSERT policy
          const { createServerClient: createSC } = await import("@supabase/ssr");
          const serviceClient = createSC(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { cookies: { getAll: () => [], setAll: () => {} } }
          );
          await serviceClient.from("profiles").insert({
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
          });
        }
      } catch {
        // Don't block the request if profile check fails
      }
    }
  } else {
    // Redirect unauthenticated users from protected pages
    const protectedPrefixes = ["/dashboard", "/compare", "/report", "/homes/report", "/admin"];
    if (protectedPrefixes.some(prefix => pathname.startsWith(prefix))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
