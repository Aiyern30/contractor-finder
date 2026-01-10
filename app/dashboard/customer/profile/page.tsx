/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Mail, Phone, Calendar, Edit2 } from "lucide-react";

export default function CustomerProfilePage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-zinc-400">Manage your customer profile</p>
          </div>
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <Card className="p-6 bg-white/5 border-white/10">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-purple-400 mb-4">
              <User className="h-5 w-5" />
              <h3 className="text-xl font-semibold text-white">
                Personal Information
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-zinc-400 block mb-1">
                  Full Name
                </label>
                <p className="text-white">
                  {profile?.full_name || "Not provided"}
                </p>
              </div>

              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-1 mb-1">
                  <Mail className="h-3 w-3" />
                  Email
                </label>
                <p className="text-white">{profile?.email || "Not provided"}</p>
              </div>

              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-1 mb-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </label>
                <p className="text-white">{profile?.phone || "Not provided"}</p>
              </div>

              <div>
                <label className="text-sm text-zinc-400 flex items-center gap-1 mb-1">
                  <Calendar className="h-3 w-3" />
                  Member Since
                </label>
                <p className="text-white">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
