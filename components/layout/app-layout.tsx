"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export function AppLayout({ children }: { children: React.ReactNode }) {
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
