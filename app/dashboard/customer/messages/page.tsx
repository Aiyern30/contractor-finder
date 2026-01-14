/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/layout/user-nav";
import { MessageSquare, Loader2, FileText } from "lucide-react";
import Image from "next/image";

interface Conversation {
  id: string;
  contractor_id: string;
  contractor_name: string;
  job_id: string;
  job_title: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function CustomerMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contractorId = searchParams.get("contractor");
  const jobId = searchParams.get("job");

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [contractorName, setContractorName] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

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
    setLoading(false); // Set loading to false here
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
    if (!userId || !jobId) return;
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
    }
  }, [jobId, userId]);

  const fetchContractorName = useCallback(async () => {
    if (!contractorId) return;
    const supabase = createClient();

    // First try to get contractor profile
    const { data: contractorData } = await supabase
      .from("contractor_profiles")
      .select("business_name, user_id")
      .eq("user_id", contractorId)
      .single();

    if (contractorData?.business_name) {
      setContractorName(contractorData.business_name);
    } else {
      // Fallback to profile full_name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", contractorId)
        .single();
      setContractorName(profileData?.full_name || null);
    }
  }, [contractorId]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Fetch all messages where user is sender or receiver
      const { data: messagesData } = await supabase
        .from("messages")
        .select(
          `
            *,
            sender:sender_id(full_name),
            receiver:receiver_id(full_name),
            job_requests:job_request_id(id, title)
          `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      // Group messages by conversation
      const conversationMap = new Map<string, Conversation>();

      for (const msg of messagesData || []) {
        if (!msg.job_request_id) continue;

        const otherId =
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const conversationKey = `${msg.job_request_id}-${otherId}`;

        if (!conversationMap.has(conversationKey)) {
          // Get contractor name
          const { data: contractorData } = await supabase
            .from("contractor_profiles")
            .select("business_name")
            .eq("user_id", otherId)
            .single();

          const contractorName =
            contractorData?.business_name ||
            (msg.sender_id === user.id
              ? msg.receiver?.full_name
              : msg.sender?.full_name) ||
            "Unknown";

          // Count unread messages
          const unreadCount =
            messagesData?.filter(
              (m) =>
                m.job_request_id === msg.job_request_id &&
                m.receiver_id === user.id &&
                m.sender_id === otherId &&
                !m.is_read
            ).length || 0;

          conversationMap.set(conversationKey, {
            id: conversationKey,
            contractor_id: otherId,
            contractor_name: contractorName,
            job_id: msg.job_request_id,
            job_title: msg.job_requests?.title || "Untitled Job",
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: unreadCount,
          });
        }
      }

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!contractorId || !jobId) {
      fetchConversations();
    } else {
      fetchUserId();
    }
  }, [contractorId, jobId, fetchConversations, fetchUserId]);

  useEffect(() => {
    if (userId && contractorId && jobId) {
      fetchProjectDetails();
      fetchMessages();
      fetchContractorName();
    }
  }, [
    userId,
    contractorId,
    jobId,
    fetchProjectDetails,
    fetchMessages,
    fetchContractorName,
  ]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !userId || !contractorId || !jobId) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from("messages").insert({
        job_request_id: jobId,
        sender_id: userId,
        receiver_id: contractorId,
        message: messageText,
      });
      if (error) throw error;
      setMessageText("");
      fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // If no contractor/job param, show conversation list
  if (!contractorId || !jobId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
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
          ) : conversations.length === 0 ? (
            <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-500/10 mb-6">
                <MessageSquare className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No Messages Yet
              </h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                When you contact contractors about your jobs, your conversations
                will appear here.
              </p>
              <Button
                onClick={() => router.push("/dashboard/customer/jobs")}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <FileText className="h-4 w-4 mr-2" />
                View My Jobs
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/dashboard/customer/messages?contractor=${conversation.contractor_id}&job=${conversation.job_id}`
                    )
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 shrink-0">
                      <span className="text-white font-bold text-lg">
                        {conversation.contractor_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-white truncate">
                          {conversation.contractor_name}
                        </h4>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                          {new Date(
                            conversation.last_message_time
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-purple-400 mb-1 truncate">
                        Re: {conversation.job_title}
                      </div>
                      <p className="text-sm text-zinc-400 truncate">
                        {conversation.last_message}
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shrink-0">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs">
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
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                  Me
                </div>
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  // Chat UI for specific contractor/job
  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A]">
      {/* Fixed Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl z-50 shrink-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Messages</h2>
            {contractorName && (
              <span className="text-sm text-zinc-400">
                with {contractorName}
              </span>
            )}
          </div>
          <UserNav />
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full mx-auto flex flex-col m-0 md:m-0 bg-white/5 border-0 md:border border-white/10 rounded-none md:rounded-xl">
          {/* Project Details Section */}
          {projectDetails && (
            <div className="border-b border-white/10 bg-zinc-900/50 shrink-0">
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
                    <p className="text-zinc-500 mb-1">Contractor</p>
                    <p className="text-white">
                      {contractorName || "Loading..."}
                    </p>
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

          {/* Chat Messages - Scrollable Area */}
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

          {/* Fixed Input Section */}
          <div className="border-t border-white/10 p-4 bg-zinc-900/50 shrink-0">
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
