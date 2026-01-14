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

export default function ContractorMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer");
  const jobId = searchParams.get("job");

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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

  const fetchJobTitle = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("job_requests")
      .select("title")
      .eq("id", jobId)
      .single();
    setJobTitle(data?.title || null);
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

  useEffect(() => {
    fetchUserId();
  }, [fetchUserId]);

  useEffect(() => {
    if (userId && customerId && jobId) {
      fetchJobTitle();
      fetchMessages();
    }
  }, [userId, customerId, jobId, fetchJobTitle, fetchMessages]);

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

  // Chat UI for specific customer/job
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Messages</h2>
          <UserNav />
        </div>
      </header>
      <div className="container mx-auto p-4 md:p-8 max-w-2xl">
        <Card className="p-4 md:p-6 bg-white/5 border-white/10 mb-6">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-400" />
              <span className="font-semibold text-white text-lg">
                {jobTitle ? jobTitle : "Project"}
              </span>
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Chat about this project with the customer.
            </div>
          </div>
          <div className="flex flex-col gap-2 max-h-100 overflow-y-auto mb-4">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-zinc-400 py-10">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_id === userId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-3 py-2 max-w-[70%] ${
                      msg.sender_id === userId
                        ? "bg-indigo-500 text-white"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    <div className="text-xs mb-1 font-semibold">
                      {msg.sender?.full_name}
                    </div>
                    <div className="text-sm">{msg.message}</div>
                    <div className="text-[10px] text-zinc-400 mt-1 text-right">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              className="bg-zinc-900 border-white/10 text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
            />
            <Button
              onClick={handleSendMessage}
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              disabled={!messageText.trim()}
            >
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
