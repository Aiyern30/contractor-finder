/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/layout/user-nav";
import { MessageSquare, Loader2, FileText } from "lucide-react";
import Image from "next/image";

export default function ContractorMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer");
  const jobId = searchParams.get("job");

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const fetchUserId = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);
  }, [router]);

  const fetchProjectDetails = useCallback(async () => {
    if (!jobId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("job_requests")
      .select(
        `
        *,
        service_categories:category_id(name)
        `
      )
      .eq("id", jobId)
      .single();
    setProjectDetails(data);
  }, [jobId]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("messages")
        .select(
          `
            *,
            sender:sender_id(full_name),
            receiver:receiver_id(full_name)
          `
        )
        .eq("job_request_id", jobId)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [jobId, userId]);

  const fetchCustomerName = useCallback(async () => {
    if (!customerId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", customerId)
      .single();
    setCustomerName(data?.full_name || null);
  }, [customerId]);

  useEffect(() => {
    fetchUserId();
  }, [fetchUserId]);

  useEffect(() => {
    if (userId && customerId && jobId) {
      fetchProjectDetails();
      fetchMessages();
      fetchCustomerName();
    }
  }, [
    userId,
    customerId,
    jobId,
    fetchProjectDetails,
    fetchMessages,
    fetchCustomerName,
  ]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userId || !customerId || !jobId) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from("messages").insert({
        job_request_id: jobId,
        sender_id: userId,
        receiver_id: customerId,
        message: messageText,
      });
      if (error) throw error;
      setMessageText("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // If no customer/job param, show all conversations (existing code)
  if (!customerId || !jobId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            <UserNav />
          </div>
        </header>

        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 mb-6">
                <MessageSquare className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No Messages Yet
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Start a conversation by messaging customers about their job
                postings. Browse available jobs to get started.
              </p>
              <Button
                onClick={() => router.push("/dashboard/contractor/jobs")}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                Browse Available Jobs
              </Button>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Helper to group messages by sender
  function renderChatMessages(msgs: any[]) {
    let lastSenderId: string | null = null;
    return msgs.map((msg) => {
      const isFirstOfGroup = msg.sender_id !== lastSenderId;
      lastSenderId = msg.sender_id;
      const isMe = msg.sender_id === userId;
      return (
        <div
          key={msg.id}
          className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}
        >
          <div className="flex items-end gap-2 w-full">
            {!isMe && isFirstOfGroup && (
              <div className="flex flex-col items-center mr-2">
                {msg.sender?.avatar_url ? (
                  <Image
                    src={msg.sender.avatar_url}
                    alt={msg.sender.full_name || "Avatar"}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                    {msg.sender?.full_name?.charAt(0) || "?"}
                  </div>
                )}
              </div>
            )}
            <div className={`flex-1`}>
              {isFirstOfGroup && (
                <div
                  className={`text-xs mb-1 font-semibold ${
                    isMe ? "text-indigo-300 text-right" : "text-zinc-300"
                  }`}
                >
                  {isMe ? "You" : msg.sender?.full_name}
                </div>
              )}
              <div
                className={`rounded-lg px-3 py-2 max-w-[70%] ${
                  isMe
                    ? "bg-indigo-500 text-white ml-auto"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                <div className="text-sm">{msg.message}</div>
                <div className="text-[10px] text-zinc-400 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
            {isMe && isFirstOfGroup && (
              <div className="flex flex-col items-center ml-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                  You
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  // Chat UI for specific customer/job
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            {customerName && (
              <span className="text-sm text-zinc-400">with {customerName}</span>
            )}
          </div>
          <UserNav />
        </div>
      </header>
      <div className="container mx-auto flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden m-4 md:m-8 bg-white/5 border border-white/10 rounded-xl">
          {/* Project Details Section - Collapsible */}
          {projectDetails && (
            <div className="border-b border-white/10 bg-zinc-900/50">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base">
                        {projectDetails.title}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Posted{" "}
                        {new Date(
                          projectDetails.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {projectDetails.service_categories?.name}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        projectDetails.urgency === "high" ||
                        projectDetails.urgency === "emergency"
                          ? "bg-red-500/10 text-red-400"
                          : projectDetails.urgency === "medium"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-green-500/10 text-green-400"
                      }`}
                    >
                      {projectDetails.urgency}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-zinc-800/50 p-2 rounded-lg">
                    <p className="text-zinc-500 mb-1">Budget</p>
                    <p className="text-green-400 font-semibold">
                      RM {projectDetails.budget_min} -{" "}
                      {projectDetails.budget_max}
                    </p>
                  </div>
                  <div className="bg-zinc-800/50 p-2 rounded-lg">
                    <p className="text-zinc-500 mb-1">Location</p>
                    <p className="text-white">
                      {projectDetails.location || "Not specified"}
                    </p>
                  </div>
                  <div className="bg-zinc-800/50 p-2 rounded-lg">
                    <p className="text-zinc-500 mb-1">Start Date</p>
                    <p className="text-white">
                      {projectDetails.preferred_date
                        ? new Date(
                            projectDetails.preferred_date
                          ).toLocaleDateString()
                        : "Flexible"}
                    </p>
                  </div>
                  <div className="bg-zinc-800/50 p-2 rounded-lg">
                    <p className="text-zinc-500 mb-1">Customer</p>
                    <p className="text-white">{customerName || "Loading..."}</p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">Description</p>
                  <p className="text-sm text-zinc-300 line-clamp-2">
                    {projectDetails.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Section */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-zinc-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              renderChatMessages(messages)
            )}
          </div>

          {/* Input Section - Always at bottom */}
          <div className="border-t border-white/10 p-4 bg-zinc-900/50">
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                className="bg-zinc-800 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6"
                disabled={!messageText.trim()}
              >
                Send
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
