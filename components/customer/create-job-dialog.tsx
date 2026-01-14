"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: () => void;
}

export function CreateJobDialog({
  open,
  onOpenChange,
  onJobCreated,
}: CreateJobDialogProps) {
  const router = useRouter();
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
      const supabase = createClient();
      const { data } = await supabase.from("service_categories").select("*");
      if (data) setCategories(data);
    }
    if (open) {
      loadCategories();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category_id: "",
      location: "",
      budget_min: "",
      budget_max: "",
      urgency: "medium",
      preferred_date: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!formData.category_id) {
        toast.error("Please select a category");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("job_requests").insert({
        customer_id: user.id,
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

      toast.success("Job posted successfully!", {
        description: "Contractors will start sending you quotes soon.",
      });

      resetForm();
      onOpenChange(false);
      onJobCreated?.();
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("Failed to create job request", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Post New Project</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Tell us about your project to get quotes from contractors
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-white">Project Title</Label>
            <Input
              placeholder="e.g. Kitchen Renovation"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white">
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
                <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white">
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
              className="min-h-30 bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
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
              className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Budget Min (RM)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.budget_min}
                onChange={(e) =>
                  setFormData({ ...formData, budget_min: e.target.value })
                }
                className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Budget Max (RM)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.budget_max}
                onChange={(e) =>
                  setFormData({ ...formData, budget_max: e.target.value })
                }
                className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
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
              className="bg-zinc-800/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white min-w-30"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Post Project"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
