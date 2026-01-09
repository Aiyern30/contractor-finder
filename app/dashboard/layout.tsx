"use client";

import { useUser } from "@/components/providers/user-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-zinc-100">
      <div className="flex h-full">
        {/* Sidebar placeholder - can be made responsive later */}
        <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/50 p-6 backdrop-blur-xl md:flex">
          <div className="mb-8 flex items-center gap-2 font-bold text-xl">
            <span className="flex h-6 w-6 rounded-full bg-linear-to-r from-indigo-500 to-purple-500"></span>
            ContractorFinder
          </div>

          <nav className="flex flex-col gap-2">
            <a
              href="/dashboard"
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white"
            >
              Overview
            </a>
            <a
              href="/dashboard/projects"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              My Projects
            </a>
            <a
              href="/dashboard/messages"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              Messages
            </a>
            <a
              href="/dashboard/settings"
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              Settings
            </a>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
