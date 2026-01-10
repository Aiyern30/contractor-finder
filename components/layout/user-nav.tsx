"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useRouter } from "next/navigation";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function UserNav() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
      }
    }

    loadUserData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      setUser(null);
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
      window.location.href = "/";
    }
  };

  if (!user) return null;

  // Get user type directly from auth metadata - handle both homeowner and customer
  const userType = user.user_metadata?.user_type || "homeowner";
  const displayUserType = userType === 'homeowner' ? 'customer' : userType;
  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs text-purple-400 capitalize">{displayUserType}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              const path =
                userType === "contractor"
                  ? "/dashboard/contractor"
                  : userType === "admin"
                  ? "/dashboard/admin"
                  : "/dashboard/customer"; // Both homeowner and customer go here
              router.push(path);
            }}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const path =
                userType === "contractor"
                  ? "/dashboard/contractor/profile"
                  : userType === "admin"
                  ? "/dashboard/admin/profile"
                  : "/dashboard/customer/profile"; // Both homeowner and customer go here
              router.push(path);
            }}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-500 focus:text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
