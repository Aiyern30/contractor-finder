"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number;
  created_at: string;
}

export function AvailableProjects({ contractorId }: { contractorId: string }) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        // Get contractor's service categories
        const { data: services } = await supabase
          .from("contractor_services")
          .select("category_id")
          .eq("contractor_id", contractorId);

        const categoryIds = services?.map((s) => s.category_id) || [];

        if (categoryIds.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch projects matching contractor's services that haven't been bid on
        const { data: bidProjectIds } = await supabase
          .from("project_bids")
          .select("project_id")
          .eq("contractor_id", contractorId);

        const excludeIds = bidProjectIds?.map((b) => b.project_id) || [];

        let query = supabase
          .from("projects")
          .select("*")
          .eq("status", "open")
          .in("category_id", categoryIds)
          .order("created_at", { ascending: false })
          .limit(5);

        if (excludeIds.length > 0) {
          query = query.not("id", "in", `(${excludeIds.join(",")})`);
        }

        const { data } = await query;

        setProjects(data || []);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    }

    if (contractorId) {
      fetchProjects();
    }
  }, [supabase, contractorId]);

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  return (
    <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          Available Projects
        </h3>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-white/5 bg-white/5 p-4 animate-pulse"
              >
                <div className="h-20" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">
            No available projects at the moment. Check back soon!
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              onClick={() => router.push(`/projects/${project.id}`)}
              className="rounded-lg border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white">{project.title}</h4>
                <span className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">
                  New
                </span>
              </div>
              <p className="text-sm text-zinc-400 mb-2 line-clamp-2">
                {project.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>Budget: ${project.budget.toLocaleString()}</span>
                <span>•</span>
                <span>Posted {getTimeAgo(project.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
