"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Profile } from "@/types";
import {
  Activity,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  MessageSquare,
  PlusCircle,
} from "lucide-react";

export default function CustomerDashboardPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Calculate profile completion
  const profileCompletion = profile
    ? [profile.full_name, profile.phone].filter(Boolean).length * 50
    : 0;

  // Cap at 100
  const completionPercentage = Math.min(Math.round(profileCompletion), 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const displayName = profile?.full_name?.split(" ")[0] || "User";

  return (
    <CustomerLayout
      title={`Welcome back, ${displayName}`}
      description="Find and hire the best contractors for your projects"
      badge={{ text: "Homeowner Account", variant: "blue" }}
      actions={
        <Button
          onClick={() => router.push("/dashboard/customer/jobs/new")}
          className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-600 transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Post New Project
        </Button>
      }
    >
      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Profile Completion Alert */}
        {completionPercentage < 100 && (
          <Card className="p-6 bg-linear-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-zinc-400">
                  Your profile is {completionPercentage}% complete. Add your
                  details to build trust with contractors!
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard/customer/profile")}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Complete Profile
              </Button>
            </div>
          </Card>
        )}

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
    </CustomerLayout>
  );
}
