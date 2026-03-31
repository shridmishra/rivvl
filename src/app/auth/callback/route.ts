import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");
  const next = searchParams.get("next");

  // Validate redirect: must start with "/" and NOT start with "//" (protocol-relative)
  function isSafeRedirect(url: string | null): url is string {
    return typeof url === "string" && url.startsWith("/") && !url.startsWith("//");
  }

  // Determine where to send the user after auth
  const destination = isSafeRedirect(redirect)
    ? redirect
    : isSafeRedirect(next)
      ? next
      : "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // For email confirmation links, redirect to login with verified flag
      // so they see "Email verified!" message and can sign in
      // For OAuth (Google), go directly to the destination
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // User has a valid session — redirect to destination
        return NextResponse.redirect(`${origin}${destination}`);
      }

      // If no user after code exchange, this was likely an email confirmation
      // Redirect to login with verified flag
      return NextResponse.redirect(
        `${origin}/login?verified=true${destination !== "/dashboard" ? `&redirect=${encodeURIComponent(destination)}` : ""}`
      );
    }
  }

  // If code exchange failed, redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=auth_callback_failed${destination !== "/dashboard" ? `&redirect=${encodeURIComponent(destination)}` : ""}`
  );
}
