"use client";

import { ReactNode } from "react";
import { UserNav } from "@/components/layout/user-nav";
import { Badge } from "@/components/ui/badge";

interface ContractorLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  badge?: {
    text: string;
    variant?: "default" | "purple" | "blue" | "green" | "yellow" | "red";
  };
  actions?: ReactNode;
}

export function ContractorLayout({
  children,
  title,
  description,
  badge,
  actions,
}: ContractorLayoutProps) {
  const getBadgeClasses = (variant?: string) => {
    switch (variant) {
      case "purple":
        return "bg-purple-500/10 text-purple-400 ring-purple-500/20";
      case "blue":
        return "bg-blue-500/10 text-blue-400 ring-blue-500/20";
      case "green":
        return "bg-green-500/10 text-green-400 ring-green-500/20";
      case "yellow":
        return "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20";
      case "red":
        return "bg-red-500/10 text-red-400 ring-red-500/20";
      default:
        return "bg-purple-500/10 text-purple-400 ring-purple-500/20";
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 px-4 md:px-8 py-4 md:py-6 backdrop-blur-sm bg-[#0A0A0A]/95">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs md:text-sm text-zinc-500 mt-1 line-clamp-1">
              {description}
            </p>
          )}
          {badge && (
            <Badge
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset mt-2 ${getBadgeClasses(
                badge.variant
              )}`}
            >
              {badge.text}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4 ml-4">
          {actions}
          <UserNav />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
