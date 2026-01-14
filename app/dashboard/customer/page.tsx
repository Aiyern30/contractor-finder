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
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeJobs: 0,
    pendingQuotes: 0,
    totalSpent: 0,
  });

  const [activities, setActivities] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && mounted) {
        // Load profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        // --- LOAD STATS ---

        // 1. Total Projects (from job_requests)
        const { count: projectsCount } = await supabase
          .from("job_requests")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", session.user.id);

        // Get user jobs for other queries
        const { data: userJobs } = await supabase
          .from("job_requests")
          .select("id, title")
          .eq("customer_id", session.user.id);

        const jobIds = userJobs?.map((j) => j.id) || [];

        // 2. Pending Quotes
        let quotesCount = 0;
        if (jobIds.length > 0) {
          const { count } = await supabase
            .from("quotes")
            .select("*", { count: "exact", head: true })
            .in("job_request_id", jobIds)
            .eq("status", "pending");
          quotesCount = count || 0;
        }

        // 3. Active Jobs
        const { count: activeCount } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", session.user.id)
          .in("status", ["scheduled", "in_progress"]);

        // 4. Total Spent
        const { data: completedBookings } = await supabase
          .from("bookings")
          .select(
            `
            id, 
            status,
            quotes (
              quoted_price
            )
          `
          )
          .eq("customer_id", session.user.id)
          .eq("status", "completed");

        const spent =
          completedBookings?.reduce((sum, booking: any) => {
            return sum + (booking.quotes?.quoted_price || 0);
          }, 0) || 0;

        // --- LOAD RECENT ACTIVITY ---
        // We'll fetch 3 types of events: New Quotes, New/Updated Bookings, New Messages
        interface DashboardActivity {
          type: "quote" | "booking" | "message";
          title: string;
          desc: string;
          date: Date;
          timeAgo?: string;
        }

        const rawActivities: DashboardActivity[] = [];

        // A. Recent Quotes
        if (jobIds.length > 0) {
          const { data: recentQuotes } = await supabase
            .from("quotes")
            .select(
              `
              created_at, 
              quoted_price,
              job_requests (title),
              contractor_profiles (business_name)
            `
            )
            .in("job_request_id", jobIds)
            .order("created_at", { ascending: false })
            .limit(3);

          if (recentQuotes) {
            recentQuotes.forEach((q: any) => {
              rawActivities.push({
                type: "quote",
                title: "New Quote Received", // Or "Quote from [Contractor]"
                desc: `${q.contractor_profiles?.business_name} quoted $${q.quoted_price} for ${q.job_requests?.title}`,
                date: new Date(q.created_at),
              });
            });
          }
        }

        // B. Recent Bookings (Status changes or new bookings)
        const { data: recentBookings } = await supabase
          .from("bookings")
          .select(
            `
            created_at,
            status,
            scheduled_date,
            job_requests (title)
          `
          )
          .eq("customer_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (recentBookings) {
          recentBookings.forEach((b: any) => {
            let title = "Booking Update";
            if (b.status === "scheduled") title = "Project Scheduled";
            if (b.status === "completed") title = "Project Completed";

            rawActivities.push({
              type: "booking",
              title: title,
              desc: `${b.job_requests?.title} - ${b.status}`,
              date: new Date(b.created_at),
            });
          });
        }

        // C. Recent Messages
        const { data: recentMessages } = await supabase
          .from("messages")
          .select(
            `
            created_at,
            message,
            sender:profiles (full_name)
          `
          )
          .eq("receiver_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (recentMessages) {
          recentMessages.forEach((m: any) => {
            rawActivities.push({
              type: "message",
              title: `Message from ${m.sender?.full_name?.split(" ")[0]}`,
              desc: m.message,
              date: new Date(m.created_at),
            });
          });
        }

        // Sort and take top 3
        rawActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
        const finalActivities = rawActivities.slice(0, 3).map((act) => ({
          ...act,
          timeAgo: getTimeAgo(act.date),
        }));

        // --- LOAD UPCOMING SCHEDULE ---
        const { data: upcomingData } = await supabase
          .from("bookings")
          .select(
            `
            scheduled_date,
            status,
            job_requests (title),
            contractor_profiles (business_name)
          `
          )
          .eq("customer_id", session.user.id)
          .in("status", ["scheduled", "in_progress"])
          .gte("scheduled_date", new Date().toISOString())
          .order("scheduled_date", { ascending: true })
          .limit(3);

        const finalSchedule = upcomingData
          ? upcomingData.map((item: any) => ({
              title: item.job_requests?.title || "Project",
              date: new Date(item.scheduled_date).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }),
              status:
                item.status === "in_progress" ? "In Progress" : "Confirmed",
            }))
          : [];

        if (mounted) {
          setStats({
            totalProjects: projectsCount || 0,
            activeJobs: activeCount || 0,
            pendingQuotes: quotesCount,
            totalSpent: spent,
          });
          setActivities(finalActivities);
          setSchedule(finalSchedule);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  function getTimeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  }

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
            <div className="text-2xl font-bold text-white">
              {stats.totalProjects}
            </div>
            <p className="text-xs text-zinc-500 mt-1">All posted jobs</p>
          </Card>
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Active Jobs</p>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.activeJobs}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Currently in progress</p>
          </Card>
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">
                Pending Quotes
              </p>
              <Clock className="h-4 w-4 text-pink-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats.pendingQuotes}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Waiting for response</p>
          </Card>
          <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-zinc-400">Total Spent</p>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              ${stats.totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Lifetime value</p>
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
              {activities.length > 0 ? (
                activities.map((item, i) => (
                  <div key={i} className="flex items-center">
                    <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 items-center justify-center">
                      {item.type === "quote" && (
                        <DollarSign className="h-4 w-4 text-green-400" />
                      )}
                      {item.type === "booking" && (
                        <CheckCircle className="h-4 w-4 text-indigo-400" />
                      )}
                      {item.type === "message" && (
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                      )}
                    </span>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none text-white">
                        {item.title}
                      </p>
                      <p className="text-sm text-zinc-500 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-zinc-600">
                      {item.timeAgo}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-sm text-center py-4">
                  No recent activity
                </div>
              )}
            </div>
          </Card>

          <Card className="col-span-3 p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Upcoming Schedule
              </h3>
            </div>
            <div className="space-y-6">
              {schedule.length > 0 ? (
                schedule.map((item, i) => (
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
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        item.status === "Confirmed"
                          ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                          : "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 text-sm text-center py-4">
                  No upcoming scheduled jobs
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </CustomerLayout>
  );
}
