/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserNav } from "@/components/layout/user-nav";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Save,
  X,
  MapPin,
  Briefcase,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function CustomerProfilePage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedJobs: 0,
    activeJobs: 0,
    totalReviews: 0,
  });

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

      // Check user type from auth metadata
      const userType = session.user.user_metadata?.user_type;
      if (userType !== "homeowner") {
        toast.error("Access Denied", {
          description: "This page is only for customers",
        });
        router.push("/dashboard");
        return;
      }

      setUser(session.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      // Load customer stats
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("customer_id", session.user.id);

      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id")
        .eq("customer_id", session.user.id);

      setStats({
        totalBookings: bookingsData?.length || 0,
        completedJobs:
          bookingsData?.filter((b) => b.status === "completed").length || 0,
        activeJobs:
          bookingsData?.filter((b) =>
            ["scheduled", "in_progress"].includes(b.status)
          ).length || 0,
        totalReviews: reviewsData?.length || 0,
      });

      // Set form data
      setFormData({
        full_name: session.user.user_metadata?.full_name || "",
        phone: session.user.user_metadata?.phone || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Loading Failed", {
        description: "Failed to load profile data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const toastId = toast.loading("Saving profile...");

    try {
      // Update auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      });

      if (updateError) throw updateError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success("Profile Updated!", {
        description: "Your profile has been updated successfully",
        id: toastId,
      });

      await loadProfile();
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Save Failed", {
        description: "Failed to save profile changes",
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!user) return;

    setFormData({
      full_name: user.user_metadata?.full_name || "",
      phone: user.user_metadata?.phone || "",
    });

    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">
            Profile Not Found
          </h2>
          <Button onClick={() => router.push("/dashboard/customer")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">My Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode ? (
              <>
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditMode(true)}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <UserNav />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 md:p-8">
        <div className="space-y-6">
          {/* Personal Information Card */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">
                Personal Information
              </h3>
            </div>

            {/* Avatar Section */}
            <div className="flex items-start gap-6 mb-6 pb-6 border-b border-white/10">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover ring-2 ring-purple-500/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-purple-500/20">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {displayName}
                </h2>
                <p className="text-sm text-zinc-400 mb-3">{user.email}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    CUSTOMER
                  </Badge>
                  <span className="text-xs text-zinc-500 ml-2">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Member since{" "}
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-zinc-300 text-sm mb-1.5 block">
                  Full Name
                </Label>
                {isEditMode ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Your full name"
                  />
                ) : (
                  <p className="text-white">{displayName}</p>
                )}
              </div>

              <div>
                <Label className="text-zinc-300 text-sm mb-1.5 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Label>
                <p className="text-white">{user.email}</p>
                <span className="text-xs text-zinc-500">Cannot be changed</span>
              </div>

              <div>
                <Label className="text-zinc-300 text-sm mb-1.5 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </Label>
                {isEditMode ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="+60 12 345 6789"
                  />
                ) : (
                  <p className="text-white">
                    {user.user_metadata?.phone || "Not provided"}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <Briefcase className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalBookings}
                  </p>
                  <p className="text-sm text-zinc-400">Total Bookings</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Briefcase className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.completedJobs}
                  </p>
                  <p className="text-sm text-zinc-400">Completed</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <MapPin className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.activeJobs}
                  </p>
                  <p className="text-sm text-zinc-400">Active Jobs</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.totalReviews}
                  </p>
                  <p className="text-sm text-zinc-400">Reviews Given</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                onClick={() => router.push("/dashboard/customer/contractors")}
                className="bg-purple-500 hover:bg-purple-600 h-auto py-4 flex-col"
              >
                <Briefcase className="h-6 w-6 mb-2" />
                <span>Find Contractors</span>
              </Button>
              <Button
                onClick={() => router.push("/dashboard/customer/jobs")}
                className="bg-blue-500 hover:bg-blue-600 h-auto py-4 flex-col"
              >
                <MapPin className="h-6 w-6 mb-2" />
                <span>My Jobs</span>
              </Button>
              <Button
                onClick={() => router.push("/dashboard/customer/messages")}
                className="bg-green-500 hover:bg-green-600 h-auto py-4 flex-col"
              >
                <Mail className="h-6 w-6 mb-2" />
                <span>Messages</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
