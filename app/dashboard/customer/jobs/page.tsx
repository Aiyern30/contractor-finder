/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Calendar,
  XCircle,
  Loader2,
  FileText,
  DollarSign,
  PlusCircle,
} from "lucide-react";
import { CreateJobDialog } from "@/components/customer/create-job-dialog";

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
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    active: 0,
    open: 0,
    completed: 0,
  });
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    jobId: string | null;
    jobTitle: string | null;
  }>({
    open: false,
    jobId: null,
    jobTitle: null,
  });
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);

  const fetchJobs = useCallback(
    async (statusFilter: string) => {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        let query = supabase
          .from("job_requests")
          .select("*")
          .eq("customer_id", user.id);

        // Apply status filter
        if (statusFilter === "active") {
          query = query.in("status", ["assigned", "in-progress"]);
        } else if (statusFilter === "open") {
          query = query.in("status", ["open", "quoted"]);
        } else if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) {
          console.error("Error fetching jobs:", error);
          toast.error("Failed to fetch jobs", {
            description: error.message,
          });
        } else {
          setJobs(data || []);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast.error("An error occurred while fetching jobs");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const fetchFilterCounts = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Fetch all jobs count
      const { count: allCount } = await supabase
        .from("job_requests")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id);

      // Fetch active jobs count (assigned or in-progress)
      const { count: activeCount } = await supabase
        .from("job_requests")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id)
        .in("status", ["assigned", "in-progress"]);

      // Fetch open jobs count (open or quoted)
      const { count: openCount } = await supabase
        .from("job_requests")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id)
        .in("status", ["open", "quoted"]);

      // Fetch completed jobs count
      const { count: completedCount } = await supabase
        .from("job_requests")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id)
        .eq("status", "completed");

      setFilterCounts({
        all: allCount || 0,
        active: activeCount || 0,
        open: openCount || 0,
        completed: completedCount || 0,
      });
    } catch (error) {
      console.error("Error fetching filter counts:", error);
    }
  }, []);

  useEffect(() => {
    fetchJobs(filter);
    fetchFilterCounts();
  }, [filter, fetchJobs, fetchFilterCounts]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "quoted":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "assigned":
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
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("job_requests")
        .update({ status: "cancelled" })
        .eq("id", jobId);

      if (error) {
        toast.error("Failed to cancel job posting", {
          description: error.message,
        });
      } else {
        toast.success("Job posting cancelled successfully");
        // Refresh jobs list and counts
        await fetchJobs(filter);
        await fetchFilterCounts();
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
      toast.error("An error occurred while cancelling the job");
    } finally {
      setCancelDialog({ open: false, jobId: null, jobTitle: null });
    }
  };

  const openCancelDialog = (job: Job) => {
    setCancelDialog({
      open: true,
      jobId: job.id,
      jobTitle: job.title,
    });
  };

  const handleJobCreated = async () => {
    // Refresh jobs list and counts after creating a new job
    await fetchJobs(filter);
    await fetchFilterCounts();
  };

  const filterOptions = [
    { value: "all", label: "All", count: filterCounts.all },
    { value: "active", label: "Active", count: filterCounts.active },
    { value: "open", label: "Open", count: filterCounts.open },
    { value: "completed", label: "Completed", count: filterCounts.completed },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <h2 className="text-lg md:text-xl font-bold text-white">My Jobs</h2>
            <Button
              onClick={() => setCreateJobDialogOpen(true)}
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
            >
              <PlusCircle className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Post New Project</span>
            </Button>
          </div>
          <UserNav />
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6 md:space-y-8">
        {/* Filter Tabs */}
        <Card className="p-3 md:p-4 bg-white/5 border-white/10 mb-6">
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFilterChange(option.value)}
                disabled={loading}
                className={`px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
        ) : jobs.length === 0 ? (
          <Card className="p-8 md:p-12 bg-white/5 border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
              <FileText className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-lg font-medium text-white mb-2">No jobs found</p>
            <p className="text-sm md:text-base text-zinc-400 mb-6">
              {filter === "all"
                ? "You haven't posted any jobs yet"
                : `No ${filter} jobs at the moment`}
            </p>
            <Button
              onClick={() => router.push("/dashboard/customer/jobs/new")}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              Post Your First Job
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card
                key={job.id}
                className="p-4 md:p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg md:text-xl font-semibold text-white">
                        {job.title}
                      </h3>
                      <span
                        className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${getStatusColor(
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
                        {job.urgency}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-purple-400">
                      {job.location}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="flex items-center text-green-400 font-bold text-lg md:text-xl">
                      <DollarSign className="h-4 w-4 md:h-5 md:w-5" />
                      <span>
                        RM {job.budget_min} - {job.budget_max}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-zinc-500">Budget</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm md:text-base text-zinc-300 mb-3 line-clamp-2 md:line-clamp-none">
                    {job.description}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs md:text-sm text-zinc-400">
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

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={() =>
                      router.push(`/dashboard/customer/jobs/${job.id}`)
                    }
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto border-white/10 text-white hover:bg-white/5"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {job.status === "open" && (
                    <Button
                      onClick={() => openCancelDialog(job)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto border-red-500/20 text-red-400 hover:bg-red-500/10"
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

      {/* Create Job Dialog */}
      <CreateJobDialog
        open={createJobDialogOpen}
        onOpenChange={setCreateJobDialogOpen}
        onJobCreated={handleJobCreated}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog
        open={cancelDialog.open}
        onOpenChange={(open) =>
          !open && setCancelDialog({ open: false, jobId: null, jobTitle: null })
        }
      >
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Cancel Job Posting?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to cancel{" "}
              <span className="font-semibold text-white">
                "{cancelDialog.jobTitle}"
              </span>
              ? This action cannot be undone and contractors will no longer be
              able to submit quotes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Keep Job
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelDialog.jobId && cancelJob(cancelDialog.jobId)
              }
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Cancel Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
