import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimitResponse } from "@/lib/rate-limit";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Rate limit: max 30 profile updates per hour per user
    const rlResponse = rateLimitResponse(
      { name: "profile", maxRequests: 30 },
      req,
      user.id
    );
    if (rlResponse) return rlResponse;

    const body = await req.json();

    // Check auth provider — OAuth users cannot change email or password
    const authProvider = user.app_metadata?.provider || "email";
    const isOAuth = authProvider !== "email";

    // Update name
    if (body.full_name !== undefined) {
      if (typeof body.full_name === "string" && body.full_name.length > 100) {
        return NextResponse.json(
          { error: "Name must be under 100 characters" },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: body.full_name })
        .eq("id", user.id);

      if (error) {
        return NextResponse.json(
          { error: "Failed to update name" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Update email (uses Supabase auth which sends verification)
    if (body.email !== undefined) {
      if (isOAuth) {
        return NextResponse.json(
          { error: "Email changes are not allowed for OAuth accounts. Your email is managed by your login provider." },
          { status: 400 }
        );
      }

      const { error } = await supabase.auth.updateUser({
        email: body.email,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Verification email sent to ${body.email}. Click the link to confirm the change.`,
      });
    }

    // Update password (only for email/password users)
    if (body.password !== undefined) {
      if (isOAuth) {
        return NextResponse.json(
          { error: "Password changes are not allowed for OAuth accounts." },
          { status: 400 }
        );
      }

      if (typeof body.password !== "string" || body.password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Require current password
      if (!body.current_password || typeof body.current_password !== "string") {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      // Verify the current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: body.current_password,
      });

      if (verifyError) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 403 }
        );
      }

      const { error } = await supabase.auth.updateUser({
        password: body.password,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
