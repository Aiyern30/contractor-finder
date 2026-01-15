/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserNav } from "@/components/layout/user-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  MessageSquare,
  Shield,
  Star,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Job {
  id: string;
  customer_id: string;
  category_id: string;
  title: string;
  description: string;
  location: string;
  budget_min: number;
  budget_max: number;
  preferred_date: string;
  urgency: "low" | "medium" | "high";
  status:
    | "open"
    | "quoted"
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled";
  created_at: string;
}

interface Quote {
  id: string;
  job_request_id: string;
  contractor_id: string;
  quoted_price: number;
  estimated_duration: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  contractor: {
    id: string;
    business_name: string;
    avg_rating: number;
    total_reviews: number;
    total_jobs: number;
    user: {
      id: string;
      full_name: string;
      avatar_url: string | null;
    };
  };
}

export default function JobDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Negotiation / Acceptance State
  const [negotiateDialogOpen, setNegotiateDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [finalPrice, setFinalPrice] = useState<string>("");
  const [negotiationNote, setNegotiationNote] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  const fetchJobDetails = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch Job
      const { data: jobData, error: jobError } = await supabase
        .from("job_requests")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Fetch Quotes with Contractor Details
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select(
          `
          *,
          contractor:contractor_profiles (
            id,
            business_name,
            avg_rating,
            total_reviews,
            total_jobs,
             user:profiles (
              id,
              full_name,
              avatar_url
            )
          )
        `
        )
        .eq("job_request_id", jobId)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;

      // Transform data to match interface (handling the nested join structure carefully)
      // Supabase returns nested objects, sometimes arrays depending on relationship type.
      // Assuming 1:1 for contractor and user based on schema.

      // We need to cast or map if the types from supabase don't match exactly
      // but usually the select string handles the structure.
      // Let's trust the data structure for now but add safeguards in render.
      setQuotes((quotesData as any) || []);
    } catch (error: any) {
      console.error("Error fetching job details:", error);
      toast.error("Failed to load job details", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, fetchJobDetails]);

  const handleNegotiateClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setFinalPrice(quote.quoted_price.toString());
    setNegotiationNote("");
    setNegotiateDialogOpen(true);
  };

  const handleAcceptQuote = async () => {
    if (!selectedQuote || !job) return;

    try {
      setProcessingAction(true);
      const supabase = createClient();

      // 1. Update the accepted quote
      // If price changed, update it. Status -> accepted.
      const { error: updateQuoteError } = await supabase
        .from("quotes")
        .update({
          status: "accepted",
          quoted_price: parseFloat(finalPrice),
          // We might want to store the negotiation note somewhere, but schema doesn't have a specific field.
          // Maybe append to message or ignore for now as per "idk".
          // Let's leave it as just updating price and status.
        })
        .eq("id", selectedQuote.id);

      if (updateQuoteError) throw updateQuoteError;

      // 2. Update job status to 'assigned' or 'in-progress'
      const { error: updateJobError } = await supabase
        .from("job_requests")
        .update({
          status: "assigned",
        })
        .eq("id", job.id);

      if (updateJobError) throw updateJobError;

      // 3. (Optional) Reject other pending quotes?
      // For now, let's just leave them or set them to rejected manually if needed.
      // Usually you'd automated this. Let's rejecting others for cleanliness:
      await supabase
        .from("quotes")
        .update({ status: "rejected" })
        .eq("job_request_id", job.id)
        .neq("id", selectedQuote.id)
        .eq("status", "pending");

      toast.success("Quote accepted successfully!");
      setNegotiateDialogOpen(false);
      fetchJobDetails(); // Refresh UI
    } catch (error: any) {
      console.error("Error accepting quote:", error);
      toast.error("Failed to accept quote", { description: error.message });
    } finally {
      setProcessingAction(false);
    }
  };

  const updateJobStatus = async (newStatus: Job["status"]) => {
    if (!job) return;
    try {
      setProcessingAction(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("job_requests")
        .update({ status: newStatus })
        .eq("id", job.id);

      if (error) throw error;

      toast.success(
        `Job marked as ${newStatus.replace("_", " ").toUpperCase()}`
      );
      fetchJobDetails();
    } catch (error: any) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update status");
    } finally {
      setProcessingAction(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
      case "low":
        return "text-green-400 bg-green-500/10 border-green-500/20";
      default:
        return "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
    }
  };

  const getStatusBadgeStyles = (status: Job["status"]) => {
    switch (status) {
      case "open":
        return "text-blue-400 border-blue-500/20 bg-blue-500/10";
      case "quoted":
        return "text-cyan-400 border-cyan-500/20 bg-cyan-500/10";
      case "assigned":
        return "text-purple-400 border-purple-500/20 bg-purple-500/10";
      case "in_progress":
        return "text-orange-400 border-orange-500/20 bg-orange-500/10";
      case "completed":
        return "text-green-400 border-green-500/20 bg-green-500/10";
      case "cancelled":
        return "text-red-400 border-red-500/20 bg-red-500/10";
      default:
        return "text-zinc-400 border-zinc-500/20 bg-zinc-500/10";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-8 flex flex-col items-center justify-center text-white">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
        <Button
          onClick={() => router.push("/dashboard/customer/jobs")}
          variant="outline"
        >
          Return to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white hover:bg-white/10"
              onClick={() => router.push("/dashboard/customer/jobs")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-lg font-bold text-white leading-none mb-1">
                Job Details
              </h2>
              <p className="text-xs text-zinc-500">
                Viewing request #{job.id.slice(0, 8)}
              </p>
            </div>
          </div>
          <UserNav />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Job Overview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/5 border-white/10 overflow-hidden">
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">
                        {job.title}
                      </h1>
                      <Badge
                        className={getUrgencyColor(job.urgency)}
                        variant="outline"
                      >
                        {job.urgency.charAt(0).toUpperCase() +
                          job.urgency.slice(1)}{" "}
                        Urgency
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-zinc-400 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 text-purple-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1.5 text-purple-400" />
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1.5 text-purple-400" />
                        Preferred:{" "}
                        {job.preferred_date
                          ? new Date(job.preferred_date).toLocaleDateString()
                          : "Flexible"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end min-w-[150px]">
                    <span className="text-zinc-400 text-sm mb-1">
                      Budget Range
                    </span>
                    <span className="text-2xl font-bold text-green-400 flex items-center">
                      <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
                      {job.budget_min.toLocaleString()} -{" "}
                      {job.budget_max.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Description
                  </h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              </div>
            </Card>

            {/* Quotations Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  Quotations
                  <Badge className="ml-3 bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {quotes.length}
                  </Badge>
                </h3>
              </div>

              {quotes.length === 0 ? (
                <Card className="p-12 text-center bg-white/5 border-white/10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 mb-4">
                    <MessageSquare className="h-8 w-8 text-zinc-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    No quotes yet
                  </h3>
                  <p className="text-zinc-400">
                    Wait for contractors to review your job and send their
                    estimates.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <Card
                      key={quote.id}
                      className={`p-6 border-white/10 transition-all ${
                        quote.status === "accepted"
                          ? "bg-green-500/5 border-green-500/30"
                          : "bg-white/5 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Contractor Info */}
                        <div className="md:w-1/4 flex flex-col items-center md:items-start gap-3">
                          <Avatar className="h-16 w-16 border-2 border-white/10">
                            <AvatarImage
                              src={quote.contractor.user.avatar_url || ""}
                            />
                            <AvatarFallback className="bg-purple-600 text-white text-xl">
                              {quote.contractor.user.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-center md:text-left">
                            <h4 className="text-white font-semibold text-lg">
                              {quote.contractor.business_name}
                            </h4>
                            <p className="text-zinc-400 text-sm mb-2">
                              {quote.contractor.user.full_name}
                            </p>
                            <div className="flex items-center justify-center md:justify-start gap-1 text-yellow-400 text-sm">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>
                                {quote.contractor.avg_rating || "New"}
                              </span>
                              <span className="text-zinc-600 mx-1">•</span>
                              <span className="text-zinc-400">
                                {quote.contractor.total_jobs} jobs
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() =>
                              router.push(
                                `/dashboard/customer/contractors/${quote.contractor.id}`
                              )
                            }
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 border-white/10 text-zinc-300 hover:text-white"
                          >
                            View Profile
                          </Button>
                        </div>

                        {/* Quote Details */}
                        <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                                Quoted Price
                              </div>
                              <div className="text-2xl font-bold text-green-400">
                                RM {quote.quoted_price.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                                Duration
                              </div>
                              <div className="text-white font-medium">
                                {quote.estimated_duration || "Not specified"}
                              </div>
                            </div>
                          </div>

                          <div className="bg-black/20 rounded-lg p-4 mb-4">
                            <p className="text-zinc-300 text-sm italic">
                              "{quote.message}"
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-auto">
                            <Button
                              onClick={() =>
                                router.push(
                                  `/dashboard/customer/messages?contractor=${quote.contractor.id}&job=${job.id}`
                                )
                              }
                              variant="secondary"
                              className="flex-1 bg-white/10 hover:bg-white/20 text-white"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>

                            {quote.status === "accepted" ? (
                              <Button className="flex-1 bg-green-500/20 text-green-400 cursor-default hover:bg-green-500/20">
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Accepted
                              </Button>
                            ) : job.status !== "assigned" &&
                              job.status !== "in_progress" &&
                              job.status !== "completed" &&
                              job.status !== "cancelled" ? (
                              <Button
                                onClick={() => handleNegotiateClick(quote)}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                Accept / Negotiate
                              </Button>
                            ) : (
                              <Button
                                disabled
                                className="flex-1 bg-white/5 text-zinc-500"
                              >
                                {quote.status === "rejected"
                                  ? "Rejected"
                                  : "Closed"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Status Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-zinc-400">Status</span>
                  <Badge
                    variant="outline"
                    className={getStatusBadgeStyles(job.status)}
                  >
                    {job.status
                      .replace("_", " ")
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </Badge>
                </div>

                {/* Status Actions */}
                {job.status === "assigned" && (
                  <Button
                    onClick={() => updateJobStatus("in_progress")}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={processingAction}
                  >
                    Start Job
                  </Button>
                )}

                {job.status === "in_progress" && (
                  <Button
                    onClick={() => updateJobStatus("completed")}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={processingAction}
                  >
                    Mark as Completed
                  </Button>
                )}

                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-zinc-400">Quotes Received</span>
                  <span className="text-white font-mono">{quotes.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-zinc-400">Avg. Quote</span>
                  <span className="text-white font-mono">
                    {quotes.length > 0
                      ? `RM ${Math.round(
                          quotes.reduce((acc, q) => acc + q.quoted_price, 0) /
                            quotes.length
                        ).toLocaleString()}`
                      : "-"}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="bg-linear-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/20 p-6">
              <div className="flex items-start gap-4">
                <Shield className="h-6 w-6 text-purple-400 shrink-0" />
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Safe Hiring Tips
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Always verify contractor credentials and never pay the full
                    amount upfront. Use our platform for secure communication.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Negotiation Dialog */}
      <Dialog open={negotiateDialogOpen} onOpenChange={setNegotiateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Quotation</DialogTitle>
            <DialogDescription className="text-zinc-400">
              You are about to accept the quote from{" "}
              <span className="text-white font-medium">
                {selectedQuote?.contractor.business_name}
              </span>
              .
              <br />
              You can adjust the final agreed price if you have negotiated a
              different amount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Final Agreed Price (RM)</Label>
              <Input
                id="price"
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Notes (Optional)</Label>
              <Textarea
                id="note"
                value={negotiationNote}
                onChange={(e) => setNegotiationNote(e.target.value)}
                className="bg-white/5 border-white/10 text-white resize-none"
                placeholder="Any specific agreements or notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNegotiateDialogOpen(false)}
              className="border-white/10 text-white hover:bg-white/10"
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptQuote}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!finalPrice || processingAction}
            >
              {processingAction ? (
                <>
                  <span className="animate-spin mr-2">⏳</span> Processing...
                </>
              ) : (
                "Confirm & Accept"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
