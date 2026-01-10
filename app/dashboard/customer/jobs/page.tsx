"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import {
  Calendar,
  Clock,
  User,
  MessageSquare,
  XCircle,
  Loader2,
  FileText,
  DollarSign,
} from "lucide-react";

interface Job {
  id: string;
  contractorId: string;
  contractorName: string;
  specialty: string;
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled";
  date: string;
  time: string;
  description: string;
  createdAt: string;
  estimatedCost?: number;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

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

        const response = await fetch(`/api/bookings?customerId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
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
        return ["pending", "accepted", "in-progress"].includes(job.status);
      return job.status === filter;
    });
  }, [jobs, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "accepted":
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
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const response = await fetch(`/api/bookings/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const refreshResponse = await fetch(
            `/api/bookings?customerId=${user.id}`
          );
          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            setJobs(data);
          }
        }
      } else {
        alert("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
    }
  };

  const viewContractor = (contractorId: string) => {
    router.push(`/dashboard/customer/contractors/${contractorId}`);
  };

  const messageContractor = (contractorId: string) => {
    router.push(`/dashboard/customer/messages?contractor=${contractorId}`);
  };

  const filterOptions = [
    { value: "all", label: "All", count: jobs.length },
    {
      value: "active",
      label: "Active",
      count: jobs.filter((j) =>
        ["pending", "accepted", "in-progress"].includes(j.status)
      ).length,
    },
    {
      value: "pending",
      label: "Pending",
      count: jobs.filter((j) => j.status === "pending").length,
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
          <h2 className="text-xl font-bold text-white">My Jobs</h2>
          <UserNav />
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">
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
                        {job.contractorName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1).replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-purple-400">{job.specialty}</p>
                  </div>
                  {job.estimatedCost && (
                    <div className="text-right">
                      <div className="flex items-center text-green-400 font-bold text-xl">
                        <DollarSign className="h-5 w-5" />
                        <span>RM {job.estimatedCost}</span>
                      </div>
                      <p className="text-sm text-zinc-500">Estimated</p>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <p className="text-zinc-300 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                      {new Date(job.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-purple-400" />
                      {job.time}
                    </div>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-purple-400" />
                      Requested: {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => viewContractor(job.contractorId)}
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Contractor
                  </Button>
                  <Button
                    onClick={() => messageContractor(job.contractorId)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  {job.status === "pending" && (
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
