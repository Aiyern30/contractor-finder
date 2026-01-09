"use client";

import { useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2, User, HardHat } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function GoogleSignIn({
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogin = async (role: "customer" | "contractor") => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback?role=${role}`, // Pass role in redirect
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
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
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Join Contractor Finder
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            How would you like to use Contractor Finder?
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <button
            onClick={() => handleLogin("customer")}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 transition-all hover:bg-zinc-800 hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] group"
          >
            <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <User className="h-6 w-6 text-indigo-400" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">I'm a User</div>
              <div className="text-xs text-zinc-500 mt-1">Hiring a Pro</div>
            </div>
          </button>

          <button
            onClick={() => handleLogin("contractor")}
            disabled={isLoading}
            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 transition-all hover:bg-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group"
          >
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <HardHat className="h-6 w-6 text-purple-400" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-white">I'm a Pro</div>
              <div className="text-xs text-zinc-500 mt-1">Looking for Work</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
