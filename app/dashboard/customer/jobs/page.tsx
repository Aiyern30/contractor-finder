"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import {
  Calendar,
  XCircle,
  Loader2,
  FileText,
  DollarSign,
  PlusCircle,
} from "lucide-react";

interface Job {
  id: string;
  customer_id: string;
  category_id: string;
  title: string;
  description: string;
  location: string;
  budget_min: string;
  budget_max: string;
  preferred_date: string;
  urgency: "low" | "medium" | "high";
  status: "open" | "in-progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setCurrentUserId(user.id);

        // Fetch posted jobs from job_requests table
        const { data, error } = await supabase
          .from("job_requests")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching jobs:", error);
        } else {
          setJobs(data || []);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [router]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filter === "all") return true;
      if (filter === "active")
        return ["open", "in-progress"].includes(job.status);
      return job.status === filter;
    });
  }, [jobs, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "in-progress":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const cancelJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to cancel this job posting?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("job_requests")
        .update({ status: "cancelled" })
        .eq("id", jobId);

      if (error) {
        alert("Failed to cancel job posting");
      } else {
        // Refresh jobs list
        const { data } = await supabase
          .from("job_requests")
          .select("*")
          .eq("customer_id", currentUserId)
          .order("created_at", { ascending: false });
        setJobs(data || []);
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
    }
  };

  const filterOptions = [
    { value: "all", label: "All", count: jobs.length },
    {
      value: "active",
      label: "Active",
      count: jobs.filter((j) => ["open", "in-progress"].includes(j.status))
        .length,
    },
    {
      value: "open",
      label: "Open",
      count: jobs.filter((j) => j.status === "open").length,
    },
    {
      value: "completed",
      label: "Completed",
      count: jobs.filter((j) => j.status === "completed").length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white">My Jobs</h2>
            <Button
              onClick={() => router.push("/dashboard/customer/jobs/new")}
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Post New Project
            </Button>
          </div>
          <UserNav />
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Filter Tabs */}
        <Card className="p-4 bg-white/5 border-white/10 mb-6">
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === option.value
                    ? "bg-purple-500 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </Card>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-lg font-medium text-white mb-2">No jobs found</p>
            <p className="text-zinc-400 mb-6">
              {filter === "all"
                ? "You haven't booked any contractors yet"
                : `No ${filter} jobs at the moment`}
            </p>
            <Button
              onClick={() => router.push("/dashboard/customer/contractors")}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              Find Contractors
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {job.title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1).replace("-", " ")}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          job.urgency === "high"
                            ? "bg-red-500/10 text-red-400"
                            : job.urgency === "medium"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-green-500/10 text-green-400"
                        }`}
                      >
                        {job.urgency} urgency
                      </span>
                    </div>
                    <p className="text-purple-400">{job.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-400 font-bold text-xl">
                      <DollarSign className="h-5 w-5" />
                      <span>
                        RM {job.budget_min} - {job.budget_max}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500">Budget</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-zinc-300 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                      Preferred:{" "}
                      {new Date(job.preferred_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-purple-400" />
                      Posted: {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      router.push(`/dashboard/customer/jobs/${job.id}`)
                    }
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {job.status === "open" && (
                    <Button
                      onClick={() => cancelJob(job.id)}
                      variant="outline"
                      className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
