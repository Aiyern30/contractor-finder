"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Settings,
  PlusCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onItemClick?: () => void;
}

export function DashboardSidebar({ className, onItemClick }: SidebarProps) {
  const pathname = usePathname();

  const routes = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: "My Projects",
      icon: Briefcase,
      href: "/dashboard/projects",
      active: pathname === "/dashboard/projects",
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/dashboard/messages",
      active: pathname === "/dashboard/messages",
    },
    {
      label: "Profile Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: pathname === "/dashboard/settings",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-black/50 backdrop-blur-xl border-r border-white/10",
        className
      )}
    >
      <div className="p-6">
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-xl tracking-tight text-white"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <div className="h-4 w-4 bg-white rounded-full opacity-80" />
          </div>
          ContractorFinder
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-1">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2 mb-4">
          Main Menu
        </div>
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            onClick={onItemClick}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              route.active
                ? "bg-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <route.icon
              className={cn(
                "h-5 w-5 transition-colors",
                route.active
                  ? "text-indigo-400"
                  : "text-zinc-500 group-hover:text-zinc-300"
              )}
            />
            {route.label}
          </Link>
        ))}
      </div>

      <div className="p-4 mt-auto">
        <div className="rounded-2xl bg-linear-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4">
          <p className="text-xs font-medium text-indigo-300 mb-1">Need help?</p>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Check our documentation or contact support.
          </p>
          <button className="mt-3 w-full rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
}
