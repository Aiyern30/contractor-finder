"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/bookings");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filter === "all") return true;
    if (filter === "active")
      return ["pending", "accepted", "in-progress"].includes(job.status);
    return job.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        fetchJobs();
      } else {
        alert("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error cancelling job:", error);
    }
  };

  const viewContractor = (contractorId: string) => {
    router.push(`/customer/contractors/${contractorId}`);
  };

  const messageContractor = (contractorId: string) => {
    router.push(`/customer/messages?contractor=${contractorId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Jobs</h1>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({jobs.length})
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-lg ${
                filter === "active"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Active (
              {
                jobs.filter((j) =>
                  ["pending", "accepted", "in-progress"].includes(j.status)
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg ${
                filter === "pending"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-lg ${
                filter === "completed"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">
                      {job.contractorName}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        job.status
                      )}`}
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600">{job.specialty}</p>
                </div>
                {job.estimatedCost && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ${job.estimatedCost}
                    </p>
                    <p className="text-sm text-gray-600">Estimated</p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-gray-700 mb-2">{job.description}</p>
                <div className="flex gap-4 text-sm text-gray-600">
                  <p>📅 {new Date(job.date).toLocaleDateString()}</p>
                  <p>🕐 {job.time}</p>
                  <p>
                    📝 Requested: {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => viewContractor(job.contractorId)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  View Contractor
                </button>
                <button
                  onClick={() => messageContractor(job.contractorId)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Message
                </button>
                {job.status === "pending" && (
                  <button
                    onClick={() => cancelJob(job.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 text-lg mb-4">No jobs found.</p>
              <button
                onClick={() => router.push("/customer/contractors")}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Find Contractors
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
