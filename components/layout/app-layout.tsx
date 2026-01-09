"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import type { User } from "@supabase/supabase-js";

// Helper function to check if page is public
function isPublicPage(path: string) {
  return path === "/" || path === "/auth/select-role";
}

// Helper function to get correct dashboard path based on user type
function getDashboardPath(userType: string) {
  switch (userType) {
    case "homeowner":
      return "/dashboard/customer";
    case "contractor":
      return "/dashboard/contractor";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/customer";
  }
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // If user exists and we're on a protected route, check for role
      if (currentUser && !isPublicPage(pathname)) {
        const userType = currentUser.user_metadata?.user_type;

        if (!userType) {
          // No role found, redirect to role selection
          router.replace("/auth/select-role");
          setIsInitializing(false);
          return;
        }

        // Check if user is on correct dashboard
        if (pathname.startsWith("/dashboard")) {
          const correctPath = getDashboardPath(userType);

          // If on generic /dashboard, redirect to correct one
          if (pathname === "/dashboard") {
            router.replace(correctPath);
            return;
          }

          // Check if user is trying to access wrong dashboard
          if (
            !pathname.startsWith(correctPath) &&
            !pathname.startsWith("/dashboard/settings")
          ) {
            router.replace(correctPath);
            return;
          }
        }
      }

      setIsInitializing(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const newUser = session?.user ?? null;
      setUser(newUser);

      // Handle sign out
      if (event === "SIGNED_OUT" || !newUser) {
        if (!isPublicPage(pathname)) {
          router.replace("/");
          setTimeout(() => {
            window.location.href = "/";
          }, 100);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, pathname, router]);

  // Public pages without layout
  if (isPublicPage(pathname)) {
    return <>{children}</>;
  }

  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Dashboard pages get the layout
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return (
      <div className="h-screen w-full overflow-hidden bg-[#0A0A0A] text-zinc-100 flex flex-col md:flex-row">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <div className="h-6 w-6 rounded bg-linear-to-br from-indigo-500 to-purple-600" />
            ContractorFinder
          </div>
          <MobileNav />
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-72 h-full flex-col">
          <DashboardSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-white/10">
          {children}
        </main>
      </div>
    );
  }

  // Other pages without layout
  return <>{children}</>;
}
