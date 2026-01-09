/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { User, HardHat, Loader2 } from "lucide-react";

export default function SelectRolePage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user already has a role
    async function checkRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      // Check raw_user_meta_data for user_type
      if (user.user_metadata?.user_type) {
        router.replace("/dashboard");
        return;
      }

      setIsChecking(false);
    }

    checkRole();
  }, [supabase, router]);

  const handleRoleSelection = async (role: "homeowner" | "contractor") => {
    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Update raw_user_meta_data with role
      const { data: updatedUser, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            user_type: role,
          },
        });

      if (updateError) {
        console.error("Metadata update error:", updateError);
        throw updateError;
      }

      console.log("Updated user metadata:", updatedUser);

      // Also sync to profiles table for easier querying
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          full_name:
            user.user_metadata.full_name || user.user_metadata.name || "",
          avatar_url:
            user.user_metadata.avatar_url || user.user_metadata.picture || "",
          user_type: role,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }

      // Redirect based on role
      if (role === "contractor") {
        // Check if contractor profile exists
        const { data: contractorProfile } = await supabase
          .from("contractor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!contractorProfile) {
          // No contractor profile, go to setup
          window.location.href = "/dashboard/contractor/setup";
        } else {
          window.location.href = "/dashboard/contractor";
        }
      } else {
        window.location.href = "/dashboard/customer";
      }
    } catch (error) {
      console.error("Error setting role:", error);
      alert("Failed to set role. Please try again.");
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen w-full bg-[#0A0A0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <div className="h-6 w-6 bg-white rounded-full opacity-80" />
            </div>
            <h1 className="text-3xl font-bold text-white">ContractorFinder</h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome! Choose Your Role
          </h2>
          <p className="text-zinc-400">
            How would you like to use our platform?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => handleRoleSelection("homeowner")}
            disabled={isLoading}
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:bg-zinc-800 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/5 to-transparent" />

            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-16 w-16 animate-spin text-indigo-400" />
                <p className="text-sm text-zinc-400">
                  Setting up your account...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors group-hover:scale-110 duration-300">
                    <User className="h-10 w-10 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  I'm a Homeowner
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Looking to hire professionals for my projects
                </p>
                <ul className="text-left text-sm text-zinc-500 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Post project requirements
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Get quotes from contractors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    Manage your projects
                  </li>
                </ul>
              </>
            )}
          </button>

          <button
            onClick={() => handleRoleSelection("contractor")}
            disabled={isLoading}
            className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-all hover:bg-zinc-800 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/5 to-transparent" />

            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-16 w-16 animate-spin text-purple-400" />
                <p className="text-sm text-zinc-400">
                  Setting up your account...
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex justify-center">
                  <div className="h-20 w-20 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors group-hover:scale-110 duration-300">
                    <HardHat className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  I'm a Contractor
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Looking to find work and grow my business
                </p>
                <ul className="text-left text-sm text-zinc-500 space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    Browse available projects
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    Submit competitive quotes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    Build your reputation
                  </li>
                </ul>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
