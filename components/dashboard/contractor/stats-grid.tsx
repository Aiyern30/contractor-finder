"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Briefcase, DollarSign, Star, TrendingUp } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

interface StatsData {
  activeJobs: number;
  monthlyRevenue: number;
  revenueChange: number;
  rating: number;
  reviewCount: number;
  successRate: number;
}

export function StatsGrid({ contractorId }: { contractorId: string }) {
  const { supabase } = useSupabase();
  const [stats, setStats] = useState<StatsData>({
    activeJobs: 0,
    monthlyRevenue: 0,
    revenueChange: 0,
    rating: 0,
    reviewCount: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch active jobs count
        const { count: activeJobsCount } = await supabase
          .from("project_bids")
          .select("*", { count: "exact", head: true })
          .eq("contractor_id", contractorId)
          .eq("status", "accepted");

        // Fetch this month's revenue
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: monthlyProjects } = await supabase
          .from("project_bids")
          .select("bid_amount")
          .eq("contractor_id", contractorId)
          .eq("status", "completed")
          .gte("updated_at", startOfMonth.toISOString());

        const monthlyRevenue =
          monthlyProjects?.reduce(
            (sum, bid) => sum + (bid.bid_amount || 0),
            0
          ) || 0;

        // Fetch last month's revenue for comparison
        const startOfLastMonth = new Date(startOfMonth);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

        const { data: lastMonthProjects } = await supabase
          .from("project_bids")
          .select("bid_amount")
          .eq("contractor_id", contractorId)
          .eq("status", "completed")
          .gte("updated_at", startOfLastMonth.toISOString())
          .lt("updated_at", startOfMonth.toISOString());

        const lastMonthRevenue =
          lastMonthProjects?.reduce(
            (sum, bid) => sum + (bid.bid_amount || 0),
            0
          ) || 0;

        const revenueChange =
          lastMonthRevenue > 0
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        // Fetch rating and reviews
        const { data: reviews } = await supabase
          .from("contractor_reviews")
          .select("rating")
          .eq("contractor_id", contractorId);

        const avgRating =
          reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        // Fetch success rate
        const { count: totalBids } = await supabase
          .from("project_bids")
          .select("*", { count: "exact", head: true })
          .eq("contractor_id", contractorId)
          .in("status", ["completed", "cancelled"]);

        const { count: completedBids } = await supabase
          .from("project_bids")
          .select("*", { count: "exact", head: true })
          .eq("contractor_id", contractorId)
          .eq("status", "completed");

        const successRate =
          totalBids && totalBids > 0 ? (completedBids! / totalBids) * 100 : 0;

        setStats({
          activeJobs: activeJobsCount || 0,
          monthlyRevenue,
          revenueChange,
          rating: avgRating,
          reviewCount: reviews?.length || 0,
          successRate,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    if (contractorId) {
      fetchStats();
    }
  }, [supabase, contractorId]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card
            key={i}
            className="p-6 bg-white/5 border-white/10 backdrop-blur-sm animate-pulse"
          >
            <div className="h-16" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-zinc-400">Active Jobs</p>
          <Briefcase className="h-4 w-4 text-purple-400" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.activeJobs}</div>
        <p className="text-xs text-zinc-500 mt-1">Currently working on</p>
      </Card>

      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-zinc-400">This Month</p>
          <DollarSign className="h-4 w-4 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          ${stats.monthlyRevenue.toLocaleString()}
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {stats.revenueChange > 0 ? "+" : ""}
          {stats.revenueChange.toFixed(0)}% from last month
        </p>
      </Card>

      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-zinc-400">Rating</p>
          <Star className="h-4 w-4 text-yellow-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.rating > 0 ? stats.rating.toFixed(1) : "N/A"}
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          Based on {stats.reviewCount} review
          {stats.reviewCount !== 1 ? "s" : ""}
        </p>
      </Card>

      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-zinc-400">Success Rate</p>
          <TrendingUp className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.successRate > 0 ? `${stats.successRate.toFixed(0)}%` : "N/A"}
        </div>
        <p className="text-xs text-zinc-500 mt-1">Jobs completed</p>
      </Card>
    </div>
  );
}
