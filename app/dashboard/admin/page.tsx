"use client";

import { Card } from "@/components/ui/card";
import { UserNav } from "@/components/layout/user-nav";
import { Users, Briefcase, DollarSign, Activity, Shield } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-6 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
            Admin Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Platform overview and management
          </p>
          <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-500/20 mt-2">
            <Shield className="h-3 w-3 mr-1" />
            Admin Access
          </span>
        </div>
        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>

      <div className="flex-1 p-8 space-y-8">
        {/* Platform Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Total Users</p>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">2,543</div>
            <p className="text-xs text-zinc-500 mt-1">+12% this month</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">
                Active Projects
              </p>
              <Briefcase className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">156</div>
            <p className="text-xs text-zinc-500 mt-1">Across platform</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Revenue</p>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">$45,231</div>
            <p className="text-xs text-zinc-500 mt-1">This month</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Activity</p>
              <Activity className="h-4 w-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-white">98%</div>
            <p className="text-xs text-zinc-500 mt-1">Uptime</p>
          </Card>
        </div>

        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-white mb-2">
            Admin Dashboard
          </h3>
          <p className="text-zinc-400">
            Manage users, projects, and platform settings
          </p>
        </div>
      </div>
    </div>
  );
}
