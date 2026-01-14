/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserNav } from "@/components/layout/user-nav";
import {
  MessageSquare,
  Loader2,
  FileText,
  ArrowLeft,
  Edit2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
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

interface Conversation {
  id: string;
  customer_id: string;
  customer_name: string;
  job_id: string;
  job_title: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function ContractorMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer");
  const jobId = searchParams.get("job");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    messageId: string | null;
  }>({ open: false, messageId: null });
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [deleteConversationDialog, setDeleteConversationDialog] = useState<{
    open: boolean;
    jobId: string | null;
    customerId: string | null;
    jobTitle: string | null;
  }>({ open: false, jobId: null, customerId: null, jobTitle: null });

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
            job_requests:job_request_id(id, title, customer_id)
          `
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      // Group messages by conversation (job + other person)
      const conversationMap = new Map<string, Conversation>();

      for (const msg of messagesData || []) {
        if (!msg.job_request_id) continue;

        const otherId =
          msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherName =
          msg.sender_id === user.id
            ? msg.receiver?.full_name
            : msg.sender?.full_name;

        const conversationKey = `${msg.job_request_id}-${otherId}`;

        if (!conversationMap.has(conversationKey)) {
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
            customer_id: otherId,
            customer_name: otherName || "Unknown",
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

  const fetchUserAvatars = useCallback(async () => {
    if (!customerId || !userId) return;
    const supabase = createClient();

    // Fetch both user profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", [customerId, userId]);

    if (profiles) {
      const avatarMap: Record<string, string> = {};
      profiles.forEach((profile) => {
        if (profile.avatar_url) {
          avatarMap[profile.id] = profile.avatar_url;
        }
      });
      setUserAvatars(avatarMap);
    }
  }, [customerId, userId]);

  useEffect(() => {
    if (!customerId || !jobId) {
      // Show conversation list
      fetchConversations();
    } else {
      // Show chat UI
      fetchUserId();
    }
  }, [customerId, jobId, fetchConversations, fetchUserId]);

  useEffect(() => {
    fetchUserId();
  }, [fetchUserId]);

  useEffect(() => {
    if (userId && customerId && jobId) {
      fetchProjectDetails();
      fetchMessages();
      fetchCustomerName();
      fetchUserAvatars();
    }
  }, [
    userId,
    customerId,
    jobId,
    fetchProjectDetails,
    fetchMessages,
    fetchCustomerName,
    fetchUserAvatars,
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

  const handleDeleteMessage = async (messageId: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", userId);

      if (error) throw error;

      toast.success("Message deleted");
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } finally {
      setDeleteDialog({ open: false, messageId: null });
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editMessageText.trim()) return;
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("messages")
        .update({ message: editMessageText })
        .eq("id", messageId)
        .eq("sender_id", userId);

      if (error) throw error;

      toast.success("Message updated");
      setEditingMessageId(null);
      setEditMessageText("");
      fetchMessages();
    } catch (error) {
      console.error("Error updating message:", error);
      toast.error("Failed to update message");
    }
  };

  const handleDeleteConversation = async (
    deleteJobId: string,
    deleteCustomerId: string
  ) => {
    const supabase = createClient();
    try {
      // First, get all messages for this conversation
      const { data: conversationMessages, error: fetchError } = await supabase
        .from("messages")
        .select("id")
        .eq("job_request_id", deleteJobId)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${deleteCustomerId}),and(sender_id.eq.${deleteCustomerId},receiver_id.eq.${userId})`);

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      if (!conversationMessages || conversationMessages.length === 0) {
        toast.info("No messages to delete");
        return;
      }

      // Delete all messages in this conversation
      const messageIds = conversationMessages.map((m) => m.id);

      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .in("id", messageIds);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw deleteError;
      }

      toast.success("Conversation deleted");
      fetchConversations();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeleteConversationDialog({
        open: false,
        jobId: null,
        customerId: null,
        jobTitle: null,
      });
    }
  };

  // If no customer/job param, show conversation list
  if (!customerId || !jobId) {
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
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() =>
                        router.push(
                          `/dashboard/contractor/messages?customer=${conversation.customer_id}&job=${conversation.job_id}`
                        )
                      }
                      className="flex items-start gap-4 flex-1"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20 shrink-0">
                        <span className="text-white font-bold text-lg">
                          {conversation.customer_name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-white truncate">
                            {conversation.customer_name}
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConversationDialog({
                          open: true,
                          jobId: conversation.job_id,
                          customerId: conversation.customer_id,
                          jobTitle: conversation.job_title,
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Conversation Dialog */}
        <AlertDialog
          open={deleteConversationDialog.open}
          onOpenChange={(open) =>
            !open &&
            setDeleteConversationDialog({
              open: false,
              jobId: null,
              customerId: null,
              jobTitle: null,
            })
          }
        >
          <AlertDialogContent className="bg-zinc-900 border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Delete Conversation?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Are you sure you want to delete this conversation about{" "}
                <span className="font-semibold text-white">
                  "{deleteConversationDialog.jobTitle}"
                </span>
                ? All messages will be permanently deleted and cannot be
                recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteConversationDialog.jobId &&
                  deleteConversationDialog.customerId &&
                  handleDeleteConversation(
                    deleteConversationDialog.jobId,
                    deleteConversationDialog.customerId
                  )
                }
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Conversation
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
      const isEditing = editingMessageId === msg.id;

      return (
        <div
          key={msg.id}
          className={`flex ${
            isMe ? "justify-end" : "justify-start"
          } w-full mb-2`}
          onMouseEnter={() => isMe && setHoveredMessageId(msg.id)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          <div
            className={`flex items-end gap-2 ${
              isMe ? "flex-row-reverse" : "flex-row"
            } max-w-[85%] sm:max-w-[75%] md:max-w-[70%]`}
          >
            {isFirstOfGroup && (
              <div className="flex flex-col items-center shrink-0">
                {!isMe ? (
                  msg.sender_id && userAvatars[msg.sender_id] ? (
                    <Image
                      src={userAvatars[msg.sender_id]}
                      alt={msg.sender?.full_name || "Avatar"}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs">
                      {msg.sender?.full_name?.charAt(0) || "?"}
                    </div>
                  )
                ) : userId && userAvatars[userId] ? (
                  <Image
                    src={userAvatars[userId]}
                    alt="You"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                    You
                  </div>
                )}
              </div>
            )}
            {!isFirstOfGroup && <div className="w-8 shrink-0" />}

            <div className="flex flex-col min-w-0 flex-1">
              {isFirstOfGroup && (
                <div
                  className={`text-xs mb-1 font-semibold px-1 ${
                    isMe
                      ? "text-indigo-300 text-right"
                      : "text-zinc-300 text-left"
                  }`}
                >
                  {isMe ? "You" : msg.sender?.full_name}
                </div>
              )}
              <div
                className={`relative flex items-start ${
                  isMe ? "flex-row-reverse" : "flex-row"
                } gap-2`}
              >
                <div
                  className={`rounded-2xl px-4 py-2 wrap-break-word ${
                    isMe
                      ? "bg-indigo-500 text-white rounded-br-md"
                      : "bg-zinc-800 text-zinc-200 rounded-bl-md"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editMessageText}
                        onChange={(e) => setEditMessageText(e.target.value)}
                        className="bg-white/10 border-white/20 text-white text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditMessage(msg.id)}
                          className="h-6 text-xs bg-green-500 hover:bg-green-600"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingMessageId(null);
                            setEditMessageText("");
                          }}
                          variant="outline"
                          className="h-6 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
                        {msg.message}
                      </div>
                      <div
                        className={`text-[10px] mt-1 ${
                          isMe ? "text-indigo-200" : "text-zinc-500"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </>
                  )}
                </div>
                {isMe && hoveredMessageId === msg.id && !isEditing && (
                  <div className="flex gap-1 bg-zinc-800 rounded-lg p-1 shadow-lg shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-white/10"
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditMessageText(msg.message);
                      }}
                    >
                      <Edit2 className="h-3 w-3 text-blue-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-white/10"
                      onClick={() =>
                        setDeleteDialog({ open: true, messageId: msg.id })
                      }
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  // Chat UI for specific customer/job
  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A]">
      {/* Fixed Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl z-50 shrink-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push("/dashboard/contractor/messages")}
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold text-white">Messages</h2>
            {customerName && (
              <span className="text-sm text-zinc-400">with {customerName}</span>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          !open && setDeleteDialog({ open: false, messageId: null })
        }
      >
        <AlertDialogContent className="bg-zinc-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Message?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this message? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.messageId &&
                handleDeleteMessage(deleteDialog.messageId)
              }
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
