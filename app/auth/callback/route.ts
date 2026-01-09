import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth error:", error);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    // Check if user has user_type in raw_user_meta_data
    if (data.user) {
      const userType = data.user.user_metadata?.user_type;
      
      console.log("User metadata:", data.user.user_metadata);
      console.log("User type:", userType);

      // If no user_type, redirect to role selection
      if (!userType) {
        return NextResponse.redirect(`${origin}/auth/select-role`);
      }
    }
  }

  // User has role, go to dashboard
  return NextResponse.redirect(`${origin}/dashboard`);
}
