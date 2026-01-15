/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  User,
  MessageSquare,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
  Trophy,
} from "lucide-react";
import { JobRequest } from "@/types/database";

interface JobWithCustomer extends JobRequest {
  profiles: {
    full_name: string;
    phone: string | null;
  };
  service_categories: {
    name: string;
  };
}

export default function ContractorJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobWithCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contractorId, setContractorId] = useState<string>("");
  const [existingQuote, setExistingQuote] = useState<{
    id: string;
    quoted_price: number;
    estimated_duration: string | null;
    message: string | null;
    status: string;
    created_at: string;
  } | null>(null);

  const [quoteData, setQuoteData] = useState({
    quoted_price: "",
    estimated_duration: "",
    message: "",
  });

  const fetchContractorId = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (data) setContractorId(data.id);
    }
  }, []);

  const fetchJobDetails = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("job_requests")
        .select(
          `
          *,
          profiles:customer_id (
            full_name,
            phone
          ),
          service_categories:category_id (
            name
          )
        `
        )
        .eq("id", jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  const fetchExistingQuote = useCallback(async () => {
    if (!contractorId) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("job_request_id", jobId)
        .eq("contractor_id", contractorId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching quote:", error);
        return;
      }

      setExistingQuote(data);
    } catch (error) {
      console.error("Error fetching existing quote:", error);
    }
  }, [jobId, contractorId]);

  useEffect(() => {
    fetchJobDetails();
    fetchContractorId();
  }, [fetchJobDetails, fetchContractorId]);

  useEffect(() => {
    if (contractorId) {
      fetchExistingQuote();
    }
  }, [contractorId, fetchExistingQuote]);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const supabase = createClient();

      if (!contractorId) {
        toast.error("Contractor profile not found");
        return;
      }

      // Check if quote is accepted
      if (existingQuote?.status === "accepted") {
        toast.error("Cannot modify an accepted quote");
        setSubmitting(false);
        return;
      }

      // Check if quote already exists
      if (existingQuote) {
        // Update existing quote
        const { error } = await supabase
          .from("quotes")
          .update({
            quoted_price: parseFloat(quoteData.quoted_price),
            estimated_duration: quoteData.estimated_duration,
            message: quoteData.message,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingQuote.id);

        if (error) throw error;

        toast.success("Quote updated successfully!", {
          description: "The customer will be notified of your updated quote.",
        });
      } else {
        // Create new quote
        const { error } = await supabase.from("quotes").insert({
          job_request_id: jobId,
          contractor_id: contractorId,
          quoted_price: parseFloat(quoteData.quoted_price),
          estimated_duration: quoteData.estimated_duration,
          message: quoteData.message,
          status: "pending",
        });

        if (error) throw error;

        toast.success("Quote submitted successfully!", {
          description: "The customer will be notified of your quote.",
        });
      }

      setQuoteDialogOpen(false);
      setQuoteData({
        quoted_price: "",
        estimated_duration: "",
        message: "",
      });

      // Refresh the quote
      await fetchExistingQuote();
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast.error("Failed to submit quote");
    } finally {
      setSubmitting(false);
    }
  };

  const openQuoteDialog = () => {
    // Prevent opening dialog if accepted
    if (existingQuote?.status === "accepted") {
      toast.error("You cannot edit an accepted quote");
      return;
    }

    // Pre-fill form if updating existing quote
    if (existingQuote) {
      setQuoteData({
        quoted_price: existingQuote.quoted_price.toString(),
        estimated_duration: existingQuote.estimated_duration || "",
        message: existingQuote.message || "",
      });
    }
    setQuoteDialogOpen(true);
  };

  const handleMessageCustomer = () => {
    if (job) {
      router.push(
        `/dashboard/contractor/messages?customer=${job.customer_id}&job=${jobId}`
      );
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "accepted":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "withdrawn":
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Card className="p-8 bg-white/5 border-white/10 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Job Not Found</h2>
          <p className="text-zinc-400 mb-4">
            This job posting doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push("/dashboard/contractor/jobs")}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Back to Jobs
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-zinc-400 hover:text-white mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-bold text-white">Job Details</h2>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {/* Hired Banner */}
        {existingQuote?.status === "accepted" && (
          <div className="mb-6 p-6 rounded-xl bg-linear-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border border-yellow-500/30 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors" />
            <div className="flex bg-yellow-500/20 p-3 rounded-full shrink-0 relative z-10">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-yellow-200">
                You've been hired!
              </h3>
              <p className="text-yellow-200/70 text-sm">
                The customer has accepted your quote. You can now message them
                to coordinate the work.
              </p>
            </div>
          </div>
        )}

        {/* Existing Quote Card - Only visible to contractor who submitted */}
        {existingQuote && (
          <Card className="p-6 mb-6 rounded-xl border-2 border-indigo-700 bg-linear-to-br from-zinc-900 via-indigo-950 to-purple-950 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-indigo-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-indigo-200 mb-1">
                  Your Quote
                </h3>
                <p className="text-sm text-zinc-400">
                  {existingQuote.status === "accepted"
                    ? "Congratulations! Your quote has been accepted."
                    : "You have already submitted a quote for this job"}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${getQuoteStatusColor(
                  existingQuote.status
                )} bg-zinc-900`}
              >
                {existingQuote.status.charAt(0).toUpperCase() +
                  existingQuote.status.slice(1)}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-xs text-zinc-400">Quoted Price</div>
                  <div className="text-lg font-bold text-green-300">
                    RM {existingQuote.quoted_price}
                  </div>
                </div>
              </div>

              {existingQuote.estimated_duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  <div>
                    <div className="text-xs text-zinc-400">Duration</div>
                    <div className="text-sm font-medium text-indigo-200">
                      {existingQuote.estimated_duration}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {existingQuote.message && (
              <div className="mb-4">
                <div className="text-xs text-zinc-400 mb-1">Your Message</div>
                <p className="text-sm text-indigo-200 italic">
                  "{existingQuote.message}"
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs text-zinc-500">
                Submitted on{" "}
                {new Date(existingQuote.created_at).toLocaleDateString()}
              </span>
              {existingQuote.status === "pending" && (
                <Button
                  onClick={openQuoteDialog}
                  size="sm"
                  variant="outline"
                  className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
                >
                  Update Quote
                </Button>
              )}
              {existingQuote.status === "accepted" && (
                <Button
                  disabled
                  size="sm"
                  className="bg-green-500/20 text-green-400 border border-green-500/20 cursor-not-allowed"
                >
                  Accepted
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Main Job Card */}
        <Card className="p-6 md:p-8 bg-white/5 border-white/10 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {job.service_categories.name}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(
                    job.urgency
                  )}`}
                >
                  {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}{" "}
                  Priority
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400 mb-1">Budget Range</div>
              <div className="flex items-center text-green-400 font-bold text-2xl">
                <DollarSign className="h-6 w-6" />
                <span>
                  RM {job.budget_min} - {job.budget_max}
                </span>
              </div>
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-purple-400 mt-1" />
              <div>
                <div className="text-sm text-zinc-400">Location</div>
                <div className="text-white font-medium">
                  {job.location || "Not specified"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-purple-400 mt-1" />
              <div>
                <div className="text-sm text-zinc-400">
                  Preferred Start Date
                </div>
                <div className="text-white font-medium">
                  {job.preferred_date
                    ? new Date(job.preferred_date).toLocaleDateString()
                    : "Flexible"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-purple-400 mt-1" />
              <div>
                <div className="text-sm text-zinc-400">Posted By</div>
                <div className="text-white font-medium">
                  {job.profiles.full_name}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-purple-400 mt-1" />
              <div>
                <div className="text-sm text-zinc-400">Posted On</div>
                <div className="text-white font-medium">
                  {new Date(job.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              Project Description
            </h3>
            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button
              onClick={openQuoteDialog}
              disabled={existingQuote?.status === "accepted"}
              className={`flex-1 text-white ${
                existingQuote?.status === "accepted"
                  ? "bg-green-600/50 cursor-not-allowed"
                  : "bg-indigo-500 hover:bg-indigo-600"
              }`}
              size="lg"
            >
              <DollarSign className="h-5 w-5 mr-2" />
              {existingQuote
                ? existingQuote.status === "accepted"
                  ? "Quote Accepted"
                  : "Update Quote"
                : "Submit Quote"}
            </Button>
            <Button
              onClick={handleMessageCustomer}
              variant="outline"
              className="flex-1 border-white/10 text-white hover:bg-white/5"
              size="lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Message Customer
            </Button>
          </div>
        </Card>
      </div>

      {/* Quote Submission Dialog */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {existingQuote ? "Update Your Quote" : "Submit Your Quote"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {existingQuote
                ? "Modify your pricing and timeline for this project"
                : "Provide your pricing and timeline for this project"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitQuote} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-white">Your Quote (RM)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={quoteData.quoted_price}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, quoted_price: e.target.value })
                }
                required
                className="bg-zinc-800/50 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Estimated Duration</Label>
              <Input
                placeholder="e.g. 2-3 weeks"
                value={quoteData.estimated_duration}
                onChange={(e) =>
                  setQuoteData({
                    ...quoteData,
                    estimated_duration: e.target.value,
                  })
                }
                className="bg-zinc-800/50 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Message to Customer</Label>
              <Textarea
                placeholder="Explain your approach, experience, or any questions..."
                value={quoteData.message}
                onChange={(e) =>
                  setQuoteData({ ...quoteData, message: e.target.value })
                }
                className="min-h-30 bg-zinc-800/50 border-white/10 text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuoteDialogOpen(false);
                  setQuoteData({
                    quoted_price: "",
                    estimated_duration: "",
                    message: "",
                  });
                }}
                className="flex-1 border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : existingQuote ? (
                  "Update Quote"
                ) : (
                  "Submit Quote"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
