"use client";

import { useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function GoogleSignIn({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const redirectTo = `${
        process.env.NEXT_PUBLIC_SITE_URL ?? location.origin
      }/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={isLoading}
      className={cn(
        "relative flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-8 py-4 text-sm font-medium text-white transition-all hover:bg-white/20 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 backdrop-blur-md shadow-xl overflow-hidden group",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
      )}
      <span className="font-semibold">Continue with Google</span>
    </button>
  );
}
