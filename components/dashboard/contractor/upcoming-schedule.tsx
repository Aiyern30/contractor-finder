"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

interface ScheduleItem {
  id: string;
  title: string;
  scheduled_date: string;
  status: string;
  project_id: string;
}

export function UpcomingSchedule({ contractorId }: { contractorId: string }) {
  const { supabase } = useSupabase();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        // Fetch upcoming appointments/milestones
        const { data } = await supabase
          .from("project_milestones")
          .select(
            `
            id,
            title,
            due_date,
            status,
            project_id,
            projects (
              contractor_bids:project_bids (
                contractor_id
              )
            )
          `
          )
          .gte("due_date", new Date().toISOString())
          .order("due_date", { ascending: true })
          .limit(5);

        // Filter milestones for this contractor
        const contractorSchedules =
          data
            ?.filter((item: any) =>
              item.projects?.contractor_bids?.some(
                (bid: any) => bid.contractor_id === contractorId
              )
            )
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              scheduled_date: item.due_date,
              status: item.status,
              project_id: item.project_id,
            })) || [];

        setSchedules(contractorSchedules);
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setLoading(false);
      }
    }

    if (contractorId) {
      fetchSchedule();
    }
  }, [supabase, contractorId]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return `Today, ${d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    } else {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-500/10 text-green-400 ring-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-400 ring-blue-500/20";
      case "pending":
        return "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    return (
      status?.replace("_", " ").charAt(0).toUpperCase() +
        status?.slice(1).replace("_", " ") || "Pending"
    );
  };

  return (
    <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-400" />
          Upcoming Schedule
        </h3>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/5 bg-white/5 p-4 animate-pulse"
              >
                <div className="h-16" />
              </div>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">
            No upcoming scheduled items
          </p>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  {schedule.title}
                </p>
                <p className="text-xs text-zinc-500">
                  {formatDate(schedule.scheduled_date)}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                  schedule.status
                )}`}
              >
                {getStatusLabel(schedule.status)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
