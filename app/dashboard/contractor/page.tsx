/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import { Profile } from "@/types";
import { StatsGrid } from "@/components/dashboard/contractor/stats-grid";
import { ServicesList } from "@/components/dashboard/contractor/services-list";
import { AvailableProjects } from "@/components/dashboard/contractor/available-projects";
import { UpcomingSchedule } from "@/components/dashboard/contractor/upcoming-schedule";

export default function ContractorDashboardPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contractorProfile, setContractorProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && mounted) {
        // Load user profile
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (mounted) setProfile(userProfile);

        // Load contractor profile
        const { data: contProfile } = await supabase
          .from("contractor_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (mounted) {
          if (!contProfile) {
            router.push("/dashboard/contractor/setup");
            return;
          }
          setContractorProfile(contProfile);

          // Load services
          const { data: servicesData } = await supabase
            .from("contractor_services")
            .select(
              `
              *,
              service_categories (
                name,
                description
              )
            `
            )
            .eq("contractor_id", contProfile.id);

          if (mounted) {
            setServices(servicesData || []);
            setLoading(false);
          }
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [supabase, router]);

  const profileCompletion = contractorProfile
    ? [
        contractorProfile.business_name,
        contractorProfile.bio,
        contractorProfile.city,
        contractorProfile.hourly_rate,
        services.length > 0,
      ].filter(Boolean).length * 20
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-8 py-6 backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-zinc-400">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your jobs, quotes, and grow your business
          </p>
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-1 text-xs font-medium text-purple-400 ring-1 ring-inset ring-purple-500/20 mt-2">
            Contractor Account
          </span>
        </div>
        <div className="flex items-center gap-4">
          <UserNav />
        </div>
      </header>

      <div className="flex-1 p-8 space-y-8">
        {/* Profile Completion Alert */}
        {profileCompletion < 100 && (
          <Card className="p-6 bg-linear-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Complete Your Profile
                </h3>
                <p className="text-sm text-zinc-400">
                  Your profile is {profileCompletion}% complete. Complete it to
                  get more jobs!
                </p>
              </div>
              <Button
                onClick={() =>
                  services.length === 0
                    ? router.push("/dashboard/contractor/services/add")
                    : router.push("/dashboard/contractor/profile/edit")
                }
                className="bg-purple-500 hover:bg-purple-600"
              >
                {services.length === 0 ? "Add Services" : "Complete Profile"}
              </Button>
            </div>
          </Card>
        )}

        {/* Stats Grid - Now with real data */}
        {contractorProfile && <StatsGrid contractorId={contractorProfile.id} />}

        {/* Services List */}
        <ServicesList services={services} />

        {/* Available Projects & Schedule */}
        <div className="grid gap-8 md:grid-cols-2">
          {contractorProfile && (
            <>
              <AvailableProjects contractorId={contractorProfile.id} />
              <UpcomingSchedule contractorId={contractorProfile.id} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
