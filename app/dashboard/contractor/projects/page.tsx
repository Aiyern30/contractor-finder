"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Image as ImageIcon,
  X,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  contractor_id: string;
  title: string;
  description: string;
  category_id: string;
  completion_date: string;
  project_value: number | null;
  location: string | null;
  images: string[];
  created_at: string;
  service_categories: {
    name: string;
  };
}

interface ProjectForm {
  title: string;
  description: string;
  category_id: string;
  completion_date: string;
  project_value: string;
  location: string;
  images: string[];
}

export default function ContractorProjectsPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [contractorId, setContractorId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    title: "",
    description: "",
    category_id: "",
    completion_date: "",
    project_value: "",
    location: "",
    images: [],
  });

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    projectId: string | null;
    projectTitle: string | null;
  }>({
    open: false,
    projectId: null,
    projectTitle: null,
  });

  const loadData = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/");
        return;
      }

      const { data: profile } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        router.push("/dashboard/contractor/setup");
        return;
      }

      setContractorId(profile.id);

      // Load categories
      const { data: cats } = await supabase
        .from("service_categories")
        .select("id, name")
        .order("name");

      setCategories(cats || []);

      // Load projects
      const { data: projectsData } = await supabase
        .from("contractor_projects")
        .select(
          `
          *,
          service_categories (name)
        `
        )
        .eq("contractor_id", profile.id)
        .order("completion_date", { ascending: false });

      setProjects((projectsData as Project[]) || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddDialog = () => {
    setEditingProject(null);
    setProjectForm({
      title: "",
      description: "",
      category_id: "",
      completion_date: "",
      project_value: "",
      location: "",
      images: [],
    });
    setShowDialog(true);
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      category_id: project.category_id,
      completion_date: project.completion_date,
      project_value: project.project_value?.toString() || "",
      location: project.location || "",
      images: project.images || [],
    });
    setShowDialog(true);
  };

  const handleSaveProject = async () => {
    if (!projectForm.title || !projectForm.category_id) {
      alert("Please fill in required fields");
      return;
    }

    setIsSaving(true);

    try {
      const projectData = {
        contractor_id: contractorId,
        title: projectForm.title,
        description: projectForm.description,
        category_id: projectForm.category_id,
        completion_date: projectForm.completion_date || null,
        project_value: projectForm.project_value
          ? parseFloat(projectForm.project_value)
          : null,
        location: projectForm.location || null,
        images: projectForm.images,
      };

      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from("contractor_projects")
          .update(projectData)
          .eq("id", editingProject.id);

        if (error) throw error;
      } else {
        // Create new project
        const { error } = await supabase
          .from("contractor_projects")
          .insert(projectData);

        if (error) throw error;
      }

      await loadData();
      setShowDialog(false);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (projectId: string, projectTitle: string) => {
    setDeleteDialog({
      open: true,
      projectId,
      projectTitle,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.projectId) return;

    try {
      const { error } = await supabase
        .from("contractor_projects")
        .delete()
        .eq("id", deleteDialog.projectId);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== deleteDialog.projectId));
      setDeleteDialog({ open: false, projectId: null, projectTitle: null });
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const addImageUrl = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      setProjectForm({
        ...projectForm,
        images: [...projectForm.images, url],
      });
    }
  };

  const removeImage = (index: number) => {
    setProjectForm({
      ...projectForm,
      images: projectForm.images.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            My Projects Portfolio
          </h1>
          <p className="text-zinc-400">
            Showcase your completed work to attract more customers
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-purple-500 hover:bg-purple-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <ImageIcon className="h-16 w-16 text-zinc-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Projects Yet
          </h3>
          <p className="text-zinc-400 mb-4">
            Start building your portfolio by adding your completed projects
          </p>
          <Button
            onClick={openAddDialog}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Project
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all"
            >
              {/* Project Image */}
              <div className="relative aspect-video bg-zinc-800 overflow-hidden">
                {project.images && project.images.length > 0 ? (
                  <Image
                    src={project.images[0]}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-zinc-600" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditDialog(project)}
                    className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openDeleteDialog(project.id, project.title)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white line-clamp-1">
                    {project.title}
                  </h3>
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 shrink-0 ml-2">
                    {project.service_categories.name}
                  </Badge>
                </div>

                <p className="text-sm text-zinc-400 mb-3 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex flex-col gap-2 text-xs text-zinc-500">
                  {project.completion_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Completed:{" "}
                      {new Date(project.completion_date).toLocaleDateString()}
                    </div>
                  )}
                  {project.project_value && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Value: RM {project.project_value.toLocaleString()}
                    </div>
                  )}
                  {project.location && (
                    <div className="text-zinc-500">📍 {project.location}</div>
                  )}
                </div>

                {project.images && project.images.length > 1 && (
                  <div className="mt-3 text-xs text-zinc-500">
                    +{project.images.length - 1} more photo
                    {project.images.length - 1 > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Project Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingProject ? "Edit Project" : "Add New Project"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {editingProject
                ? "Update your project details"
                : "Add a completed project to your portfolio"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div>
              <Label className="text-zinc-300">Project Title *</Label>
              <Input
                value={projectForm.title}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, title: e.target.value })
                }
                placeholder="e.g., Modern Kitchen Renovation"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-zinc-300">Service Category *</Label>
              <select
                value={projectForm.category_id}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    category_id: e.target.value,
                  })
                }
                className="mt-1.5 w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
              >
                <option value="">Select category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-zinc-300">Description</Label>
              <Textarea
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the project, challenges, and solutions..."
                className="mt-1.5 bg-white/5 border-white/10 text-white min-h-24"
              />
            </div>

            {/* Date and Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Completion Date</Label>
                <Input
                  type="date"
                  value={projectForm.completion_date}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      completion_date: e.target.value,
                    })
                  }
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300">Project Value (RM)</Label>
                <Input
                  type="number"
                  value={projectForm.project_value}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      project_value: e.target.value,
                    })
                  }
                  placeholder="5000"
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-zinc-300">Location</Label>
              <Input
                value={projectForm.location}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, location: e.target.value })
                }
                placeholder="City or area"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Images */}
            <div>
              <Label className="text-zinc-300">Project Images</Label>
              <Button
                type="button"
                onClick={addImageUrl}
                variant="outline"
                className="mt-1.5 w-full border-white/10 text-white hover:bg-white/5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Image URL
              </Button>

              {projectForm.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {projectForm.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={img}
                        alt={`Project ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={isSaving}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, projectId: null, projectTitle: null })
        }
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {deleteDialog.projectTitle}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
