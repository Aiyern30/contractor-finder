"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { UserNav } from "@/components/layout/user-nav";
import { Profile } from "@/types";
import {
  Briefcase,
  DollarSign,
  Star,
  TrendingUp,
  Calendar,
  FileText,
} from "lucide-react";

export default function ContractorDashboardPage() {
  const { supabase } = useSupabase();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && mounted) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (mounted) {
          setProfile(data);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-6 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your jobs, quotes, and grow your business
          </p>
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20 mt-2">
            Contractor Account
          </span>
        </div>
        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>

      <div className="flex-1 p-8 space-y-8">
        {/* Stats Grid - Contractor specific */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Active Jobs</p>
              <Briefcase className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">8</div>
            <p className="text-xs text-zinc-500 mt-1">Currently working on</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">This Month</p>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">$12,450</div>
            <p className="text-xs text-zinc-500 mt-1">+22% from last month</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Rating</p>
              <Star className="h-4 w-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">4.8</div>
            <p className="text-xs text-zinc-500 mt-1">Based on 42 reviews</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Success Rate</p>
              <TrendingUp className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">94%</div>
            <p className="text-xs text-zinc-500 mt-1">Jobs completed</p>
          </Card>
        </div>

        {/* Available Projects & Schedule */}
        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                Available Projects
              </h3>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">
                    Kitchen Renovation
                  </h4>
                  <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">
                    New
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-2">
                  Full kitchen remodel with new cabinets...
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-500">
                  <span>Budget: $15,000</span>
                  <span>•</span>
                  <span>Posted 2 hours ago</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-400" />
                Upcoming Schedule
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    Site Inspection
                  </p>
                  <p className="text-xs text-zinc-500">Tomorrow, 10:00 AM</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                  Confirmed
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">Final Review</p>
                  <p className="text-xs text-zinc-500">Jan 15, 2:00 PM</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                  Pending
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
