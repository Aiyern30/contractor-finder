"use client";

import { useUser } from "@/components/providers/user-provider";
import { Card } from "@/components/ui/card";
import { UserNav } from "@/components/layout/user-nav";
import {
  Activity,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
} from "lucide-react";

export default function DashboardPage() {
  const { profile } = useUser();

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-6 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {profile?.user_type === "contractor"
              ? "Manage your jobs and quotes."
              : "Here's what's happening with your projects today."}
          </p>
          {profile?.user_type && (
            <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 mt-2 capitalize">
              {profile.user_type} Account
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>

      <div className="flex-1 p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">
                Total Projects
              </p>
              <Briefcase className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">12</div>
            <p className="text-xs text-zinc-500 mt-1">+2 from last month</p>
          </Card>
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Active Jobs</p>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">3</div>
            <p className="text-xs text-zinc-500 mt-1">Currently in progress</p>
          </Card>
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">
                Pending Quotes
              </p>
              <Clock className="h-4 w-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-white">5</div>
            <p className="text-xs text-zinc-500 mt-1">Waiting for response</p>
          </Card>
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Total Spent</p>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">$2,450</div>
            <p className="text-xs text-zinc-500 mt-1">+15% from last month</p>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Recent Activity
              </h3>
            </div>
            <div className="space-y-6">
              {[
                {
                  title: "New Quote Received",
                  desc: "Plumbing Fix for Kitchen",
                  time: "2 hours ago",
                  icon: <DollarSign className="h-4 w-4 text-green-400" />,
                },
                {
                  title: "Project Completed",
                  desc: "Bathroom Renovation",
                  time: "Yesterday",
                  icon: <CheckCircle className="h-4 w-4 text-indigo-400" />,
                },
                {
                  title: "Message from John",
                  desc: "Regarding electrical wiring...",
                  time: "2 days ago",
                  icon: <MessageSquare className="h-4 w-4 text-blue-400" />,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 items-center justify-center">
                    {item.icon}
                  </span>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-zinc-500">{item.desc}</p>
                  </div>
                  <div className="ml-auto font-medium text-xs text-zinc-600">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="col-span-3 p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Upcoming Schedule
              </h3>
            </div>
            <div className="space-y-6">
              {[
                {
                  title: "Site Inspection",
                  date: "Tomorrow, 10:00 AM",
                  status: "Confirmed",
                },
                {
                  title: "Final Review",
                  date: "Jan 15, 2:00 PM",
                  status: "Pending",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-zinc-500">{item.date}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
