"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Users,
  FileText,
  BarChart3,
  UserCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  onItemClick?: () => void;
}

export function DashboardSidebar({ className, onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { supabase } = useSupabase();
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    async function getUserType() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserType(session.user.user_metadata?.user_type);
      }
    }
    getUserType();
  }, [supabase]);

  // Customer/Homeowner routes
  const customerRoutes = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard/customer",
      active: pathname === "/dashboard/customer",
    },
    {
      label: "My Jobs",
      icon: Briefcase,
      href: "/dashboard/customer/jobs",
      active: pathname?.startsWith("/dashboard/customer/jobs"),
    },
    {
      label: "Find Contractors",
      icon: Search,
      href: "/dashboard/customer/contractors",
      active: pathname?.startsWith("/dashboard/customer/contractors"),
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/dashboard/customer/messages",
      active: pathname?.startsWith("/dashboard/customer/messages"),
    },
    {
      label: "Profile",
      icon: UserCircle,
      href: "/dashboard/customer/profile",
      active: pathname?.startsWith("/dashboard/customer/profile"),
    },
  ];

  // Contractor routes
  const contractorRoutes = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard/contractor",
      active: pathname === "/dashboard/contractor",
    },
    {
      label: "Available Jobs",
      icon: FileText,
      href: "/dashboard/contractor/jobs",
      active: pathname?.startsWith("/dashboard/contractor/jobs"),
    },
    {
      label: "My Projects",
      icon: Briefcase,
      href: "/dashboard/contractor/projects",
      active: pathname?.startsWith("/dashboard/contractor/projects"),
    },
    {
      label: "Messages",
      icon: MessageSquare,
      href: "/dashboard/contractor/messages",
      active: pathname?.startsWith("/dashboard/contractor/messages"),
    },
    {
      label: "Profile",
      icon: UserCircle,
      href: "/dashboard/contractor/profile",
      active: pathname?.startsWith("/dashboard/contractor/profile"),
    },
  ];

  // Admin routes
  const adminRoutes = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard/admin",
      active: pathname === "/dashboard/admin",
    },
    {
      label: "Users",
      icon: Users,
      href: "/dashboard/admin/users",
      active: pathname?.startsWith("/dashboard/admin/users"),
    },
    {
      label: "Projects",
      icon: Briefcase,
      href: "/dashboard/admin/projects",
      active: pathname?.startsWith("/dashboard/admin/projects"),
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/dashboard/admin/analytics",
      active: pathname?.startsWith("/dashboard/admin/analytics"),
    },
  ];

  // Select routes based on user type
  const routes =
    userType === "contractor"
      ? contractorRoutes
      : userType === "admin"
      ? adminRoutes
      : customerRoutes;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-zinc-950 md:border-r border-white/10",
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
          {userType === "contractor"
            ? "Contractor Menu"
            : userType === "admin"
            ? "Admin Menu"
            : "Main Menu"}
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
