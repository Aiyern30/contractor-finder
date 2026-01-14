"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { CustomerLayout } from "@/components/layout/customer-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    location: "",
    budget_min: "",
    budget_max: "",
    urgency: "medium",
    preferred_date: "",
  });

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from("service_categories").select("*");
      if (data) setCategories(data);
    }
    loadCategories();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      if (!formData.category_id) {
        alert("Please select a category");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("job_requests").insert({
        customer_id: session.user.id,
        title: formData.title,
        description: formData.description,
        category_id: formData.category_id,
        location: formData.location,
        budget_min: formData.budget_min
          ? parseFloat(formData.budget_min)
          : null,
        budget_max: formData.budget_max
          ? parseFloat(formData.budget_max)
          : null,
        preferred_date: formData.preferred_date || null,
        urgency: formData.urgency,
        status: "open",
      });

      if (error) throw error;

      router.push("/dashboard/customer/jobs");
      router.refresh();
    } catch (error) {
      console.error("Error creating job:", error);
      alert("Failed to create job request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout
      title="Post New Project"
      description="Tell us about your project to get quotes from contractors"
      badge={{ text: "New Project", variant: "purple" }}
    >
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="text-zinc-400 hover:text-white mb-6 pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>

        <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-white">Project Title</Label>
              <Input
                placeholder="e.g. Kitchen Renovation"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, urgency: value })
                  }
                >
                  <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white">
                    <SelectValue placeholder="Select Urgency" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    <SelectItem value="low">Low (Flexible timing)</SelectItem>
                    <SelectItem value="medium">
                      Medium (Within a few weeks)
                    </SelectItem>
                    <SelectItem value="high">High (Need ASAP)</SelectItem>
                    <SelectItem value="emergency">
                      Emergency (Immediate)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Description</Label>
              <Textarea
                placeholder="Describe your project in detail..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                className="min-h-[150px] bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Location</Label>
              <Input
                placeholder="Project address or area"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Estimated Budget (Min)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.budget_min}
                  onChange={(e) =>
                    setFormData({ ...formData, budget_min: e.target.value })
                  }
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Estimated Budget (Max)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.budget_max}
                  onChange={(e) =>
                    setFormData({ ...formData, budget_max: e.target.value })
                  }
                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Preferred Start Date</Label>
              <Input
                type="date"
                value={formData.preferred_date}
                onChange={(e) =>
                  setFormData({ ...formData, preferred_date: e.target.value })
                }
                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-500 hover:bg-indigo-600 text-white min-w-[120px]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Post Project"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </CustomerLayout>
  );
}
