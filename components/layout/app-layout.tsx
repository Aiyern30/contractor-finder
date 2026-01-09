"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import type { User } from "@supabase/supabase-js";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = useSupabase();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setIsInitializing(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const newUser = session?.user ?? null;
      setUser(newUser);

      // If user logged out and not already on home page, redirect
      if (!newUser && pathname !== "/") {
        router.replace("/");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, pathname, router]);

  // Home page always renders without layout
  const isHomePage = pathname === "/";

  if (isHomePage) {
    return <>{children}</>;
  }

  // Protected pages: show loading briefly, then layout or redirect
  if (isInitializing) {
    return (
      <div className="h-screen w-full bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // If no user on protected route, show nothing (redirect is happening)
  if (!user) {
    return null;
  }

  // Authenticated users get the full layout
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
