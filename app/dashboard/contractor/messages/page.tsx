"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import {
  MessageSquare,
  Loader2,
  FileText,
  Search,
  User,
} from "lucide-react";

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  job_title?: string;
}

export default function ContractorMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Get contractor profile
      const { data: contractorProfile } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!contractorProfile) {
        setLoading(false);
        return;
      }

      // Fetch messages (this is a simplified query, you may need to adjust based on your schema)
      const { data: messages } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:sender_id(full_name),
          receiver:receiver_id(full_name),
          job_requests:job_request_id(title)
        `
        )
        .or(
          `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
        )
        .order("created_at", { ascending: false });

      // Group messages by conversation (simplified)
      // In a real app, you'd want more sophisticated grouping
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((msg: any) => {
        const otherId =
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherName =
          msg.sender_id === user.id
            ? msg.receiver.full_name
            : msg.sender.full_name;

        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            id: otherId,
            customer_id: otherId,
            customer_name: otherName,
            last_message: msg.message,
            last_message_time: msg.created_at,
            unread_count: msg.is_read ? 0 : 1,
            job_title: msg.job_requests?.title,
          });
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

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
        ) : conversations.length === 0 ? (
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
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-zinc-400" />
              <h3 className="text-lg font-semibold text-white">
                Your Conversations
              </h3>
            </div>

            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() =>
                  router.push(
                    `/dashboard/contractor/messages/${conversation.customer_id}`
                  )
                }
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                    <User className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-semibold text-white truncate">
                        {conversation.customer_name}
                      </h4>
                      <span className="text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(
                          conversation.last_message_time
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    {conversation.job_title && (
                      <div className="text-xs text-purple-400 mb-1">
                        Re: {conversation.job_title}
                      </div>
                    )}
                    <p className="text-sm text-zinc-400 truncate">
                      {conversation.last_message}
                    </p>
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                      {conversation.unread_count}
                    </div>
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
