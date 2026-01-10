"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2 } from "lucide-react";

export default function ProfileRedirectPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    async function redirectToProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/auth/login");
          return;
        }

        // Get user profile to check user_type
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", session.user.id)
          .single();

        if (!profile) {
          router.push("/auth/select-role");
          return;
        }

        // Redirect based on user type
        switch (profile.user_type) {
          case "contractor":
            router.push("/dashboard/contractor/profile");
            break;
          case "customer":
            router.push("/dashboard/customer/profile");
            break;
          case "admin":
            router.push("/dashboard/admin/profile");
            break;
          default:
            router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error redirecting to profile:", error);
        router.push("/dashboard");
      }
    }

    redirectToProfile();
  }, [supabase, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
        <p className="text-white">Redirecting to your profile...</p>
      </div>
    </div>
  );
}
