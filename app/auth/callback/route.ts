import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const role = searchParams.get("role"); // 'customer' or 'contractor'

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!existingProfile) {
        // Create new profile
        const userRole =
          role === "contractor" || role === "customer" ? role : "customer"; // Default to customer if invalid

        await supabase.from("profiles").insert({
          id: session.user.id,
          email: session.user.email,
          full_name:
            session.user.user_metadata.full_name ||
            session.user.user_metadata.name ||
            session.user.email?.split("@")[0],
          avatar_url:
            session.user.user_metadata.avatar_url ||
            session.user.user_metadata.picture,
          user_type: userRole,
          updated_at: new Date().toISOString(),
        });

        if (userRole === "contractor") {
          // Also initialize contractor profile stub
          await supabase.from("contractor_profiles").insert({
            user_id: session.user.id,
            business_name:
              session.user.user_metadata.full_name || "My Business",
            status: "pending", // Default status
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
