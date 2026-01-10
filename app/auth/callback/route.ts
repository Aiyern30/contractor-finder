import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getDashboardPath } from "@/lib/utils/redirect-by-user-type";

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

    if (data.user) {
      const userType = data.user.user_metadata?.user_type;

      if (!userType) {
        return NextResponse.redirect(`${origin}/auth/select-role`);
      }

      // Use utility function for consistent routing
      const dashboardPath = getDashboardPath(userType);
      return NextResponse.redirect(`${origin}${dashboardPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/dashboard/customer`);
}
