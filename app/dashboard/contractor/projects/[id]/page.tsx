/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  MapPin,
  X,
  Upload,
  Save,
  Image as ImageIcon,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
  isExisting?: boolean;
}

export default function ProjectDetailPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [contractorId, setContractorId] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    title: "",
    description: "",
    category_id: "",
    completion_date: "",
    project_value: "",
    location: "",
    images: [],
  });

  const [showImageDialog, setShowImageDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const loadProject = useCallback(async () => {
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

      // Load project
      const { data: projectData, error } = await supabase
        .from("contractor_projects")
        .select(
          `
          *,
          service_categories (name)
        `
        )
        .eq("id", projectId)
        .eq("contractor_id", profile.id)
        .single();

      if (error || !projectData) {
        alert("Project not found or you don't have permission to view it");
        router.push("/dashboard/contractor/projects");
        return;
      }

      setProject(projectData as Project);
      setProjectForm({
        title: projectData.title,
        description: projectData.description,
        category_id: projectData.category_id,
        completion_date: projectData.completion_date || "",
        project_value: projectData.project_value?.toString() || "",
        location: projectData.location || "",
        images: projectData.images || [],
      });

      const existingPreviews: ImagePreview[] = (projectData.images || []).map(
        (url: string, index: number) => ({
          file: null as any,
          preview: url,
          id: `existing-${index}`,
          isExisting: true,
        })
      );
      setImagePreviews(existingPreviews);
    } catch (error) {
      console.error("Error loading project:", error);
      alert("Failed to load project");
      router.push("/dashboard/contractor/projects");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router, projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: ImagePreview[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `temp-${Date.now()}-${Math.random()}`,
      isExisting: false,
    }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImagePreview = (id: string) => {
    setImagePreviews((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      const removed = prev.find((img) => img.id === id);
      if (removed && !removed.isExisting) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
  };

  const getStoragePathFromUrl = (url: string): string | null => {
    try {
      const cleanUrl = url.split("?")[0];
      const parts = cleanUrl.split("/project-images/");
      if (parts.length === 2 && parts[1]) {
        return parts[1];
      }
      return null;
    } catch (error) {
      console.error("Error parsing image URL:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!projectForm.title || !projectForm.category_id) {
      alert("Please fill in required fields");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedUrls: string[] = [];
      const existingImages = imagePreviews
        .filter((img) => img.isExisting)
        .map((img) => img.preview);
      const newImages = imagePreviews.filter((img) => !img.isExisting);

      for (const imagePreview of newImages) {
        const fileExt = imagePreview.file.name.split(".").pop();
        const fileName = `${contractorId}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from("project-images")
          .upload(fileName, imagePreview.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("project-images")
          .getPublicUrl(data.path);

        uploadedUrls.push(urlData.publicUrl);
      }

      const allImageUrls = [...existingImages, ...uploadedUrls];

      const projectData = {
        title: projectForm.title,
        description: projectForm.description,
        category_id: projectForm.category_id,
        completion_date: projectForm.completion_date || null,
        project_value: projectForm.project_value
          ? parseFloat(projectForm.project_value)
          : null,
        location: projectForm.location || null,
        images: allImageUrls,
      };

      if (project && project.images && project.images.length > 0) {
        const removedImages = project.images.filter(
          (url) => !allImageUrls.includes(url)
        );

        if (removedImages.length > 0) {
          const pathsToDelete: string[] = [];
          for (const imageUrl of removedImages) {
            const path = getStoragePathFromUrl(imageUrl);
            if (path) {
              pathsToDelete.push(path);
            }
          }

          if (pathsToDelete.length > 0) {
            await supabase.storage.from("project-images").remove(pathsToDelete);
          }
        }
      }

      const { error } = await supabase
        .from("contractor_projects")
        .update(projectData)
        .eq("id", projectId);

      if (error) throw error;

      imagePreviews.forEach((img) => {
        if (!img.isExisting) {
          URL.revokeObjectURL(img.preview);
        }
      });

      await loadProject();
      setIsEditMode(false);
      alert("Project updated successfully!");
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    try {
      if (project.images && project.images.length > 0) {
        for (const imageUrl of project.images) {
          const path = getStoragePathFromUrl(imageUrl);
          if (path) {
            await supabase.storage.from("project-images").remove([path]);
          }
        }
      }

      const { error } = await supabase
        .from("contractor_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      alert("Project deleted successfully!");
      router.push("/dashboard/contractor/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project");
    }
  };

  const cancelEdit = () => {
    if (!project) return;
    setProjectForm({
      title: project.title,
      description: project.description,
      category_id: project.category_id,
      completion_date: project.completion_date || "",
      project_value: project.project_value?.toString() || "",
      location: project.location || "",
      images: project.images || [],
    });
    const existingPreviews: ImagePreview[] = (project.images || []).map(
      (url: string, index: number) => ({
        file: null as any,
        preview: url,
        id: `existing-${index}`,
        isExisting: true,
      })
    );
    setImagePreviews(existingPreviews);
    setIsEditMode(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
          <Button onClick={() => router.push("/dashboard/contractor/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/contractor/projects")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditMode ? (
              <Input
                value={projectForm.title}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, title: e.target.value })
                }
                className="text-3xl font-bold bg-white/5 border-white/10 text-white mb-2"
                placeholder="Project Title"
              />
            ) : (
              <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                {project.service_categories.name}
              </Badge>
              {project.completion_date && (
                <span className="text-zinc-400 text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(project.completion_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button
                  onClick={cancelEdit}
                  variant="outline"
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => setDeleteDialog(true)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Images Section */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Project Images</h2>

            {isEditMode && (
              <div className="mb-4">
                <label className="flex items-center justify-center w-full h-24 px-4 transition bg-white/5 border-2 border-white/10 border-dashed rounded-lg appearance-none cursor-pointer hover:border-purple-500/50">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-6 w-6 text-zinc-400" />
                    <span className="text-sm text-zinc-400">Add More Images</span>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {imagePreviews.length > 0 ? (
              <>
                {/* Main Image */}
                <div
                  className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden mb-4 cursor-pointer"
                  onClick={() => !isEditMode && setShowImageDialog(true)}
                >
                  <Image
                    src={imagePreviews[selectedImageIndex].preview}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                  {!imagePreviews[selectedImageIndex].isExisting && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                      New
                    </div>
                  )}
                  {isEditMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImagePreview(imagePreviews[selectedImageIndex].id);
                        setSelectedImageIndex(0);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {imagePreviews.map((img, index) => (
                    <div
                      key={img.id}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                        selectedImageIndex === index
                          ? "border-purple-500"
                          : "border-transparent"
                      }`}
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <Image src={img.preview} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                      {!img.isExisting && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                          New
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-zinc-800 rounded-lg">
                <ImageIcon className="h-16 w-16 text-zinc-600 mb-2" />
                <p className="text-zinc-500">No images</p>
              </div>
            )}
          </Card>
        </div>

        {/* Details Section */}
        <div className="space-y-6">
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Project Details</h2>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <Label className="text-zinc-300 text-sm">Category</Label>
                {isEditMode ? (
                  <Select
                    value={projectForm.category_id}
                    onValueChange={(value) =>
                      setProjectForm({ ...projectForm, category_id: value })
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white mt-1">{project.service_categories.name}</p>
                )}
              </div>

              {/* Value */}
              <div>
                <Label className="text-zinc-300 text-sm flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Project Value
                </Label>
                {isEditMode ? (
                  <Input
                    type="number"
                    value={projectForm.project_value}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, project_value: e.target.value })
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    placeholder="5000"
                  />
                ) : (
                  <p className="text-white mt-1">
                    {project.project_value
                      ? `RM ${project.project_value.toLocaleString()}`
                      : "Not specified"}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <Label className="text-zinc-300 text-sm flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                {isEditMode ? (
                  <Input
                    value={projectForm.location}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, location: e.target.value })
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white"
                    placeholder="City or area"
                  />
                ) : (
                  <p className="text-white mt-1">{project.location || "Not specified"}</p>
                )}
              </div>

              {/* Completion Date */}
              <div>
                <Label className="text-zinc-300 text-sm flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Completion Date
                </Label>
                {isEditMode ? (
                  <Input
                    type="date"
                    value={projectForm.completion_date}
                    onChange={(e) =>
                      setProjectForm({ ...projectForm, completion_date: e.target.value })
                    }
                    className="mt-1 bg-white/5 border-white/10 text-white"
                  />
                ) : (
                  <p className="text-white mt-1">
                    {project.completion_date
                      ? new Date(project.completion_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Not specified"}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Description</h2>
            {isEditMode ? (
              <Textarea
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, description: e.target.value })
                }
                className="min-h-32 bg-white/5 border-white/10 text-white"
                placeholder="Describe your project..."
              />
            ) : (
              <p className="text-zinc-300 whitespace-pre-wrap">
                {project.description || "No description provided"}
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Image Fullscreen Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800">
          <div className="relative aspect-video">
            {imagePreviews[selectedImageIndex] && (
              <Image
                src={imagePreviews[selectedImageIndex].preview}
                alt={project.title}
                fill
                className="object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete <span className="font-semibold text-white">{project.title}</span>?
              This will permanently delete all project images and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
