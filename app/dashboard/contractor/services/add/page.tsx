"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, Check, Trash2, Edit2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
}

interface SelectedService {
  categoryId: string;
  categoryName: string;
  priceMin: string;
  priceMax: string;
  description: string;
}

interface ExistingService {
  id: string;
  category_id: string;
  price_range_min: number | null;
  price_range_max: number | null;
  description: string | null;
  service_categories: {
    name: string;
    description: string | null;
  } | null; // Changed from array to single object or null
}

export default function AddServicesPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [contractorId, setContractorId] = useState<string>("");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );
  const [existingServices, setExistingServices] = useState<ExistingService[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    serviceId: string | null;
    serviceName: string | null;
  }>({
    open: false,
    serviceId: null,
    serviceName: null,
  });
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    service: ExistingService | null;
  }>({
    open: false,
    service: null,
  });
  const [editForm, setEditForm] = useState({
    priceMin: "",
    priceMax: "",
    description: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/");
        return;
      }

      // Get contractor profile ID
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

      // Load existing services with proper typing
      const { data: existingServicesData } = (await supabase
        .from("contractor_services")
        .select(
          `
          id,
          category_id,
          price_range_min,
          price_range_max,
          description,
          service_categories!inner (
            name,
            description
          )
        `
        )
        .eq("contractor_id", profile.id)) as { data: ExistingService[] | null };

      if (existingServicesData) {
        setExistingServices(existingServicesData);
      }

      // Load service categories
      const { data: cats } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (cats) {
        setCategories(cats);
      }
    }

    loadData();
  }, [supabase, router]);

  const isServiceAlreadyAdded = (categoryId: string) => {
    return (
      existingServices.some((s) => s.category_id === categoryId) ||
      selectedServices.some((s) => s.categoryId === categoryId)
    );
  };

  const addService = (category: ServiceCategory) => {
    if (isServiceAlreadyAdded(category.id)) return;

    setSelectedServices([
      ...selectedServices,
      {
        categoryId: category.id,
        categoryName: category.name,
        priceMin: "",
        priceMax: "",
        description: "",
      },
    ]);
  };

  const removeService = (categoryId: string) => {
    setSelectedServices(
      selectedServices.filter((s) => s.categoryId !== categoryId)
    );
  };

  const openDeleteDialog = (serviceId: string, serviceName: string) => {
    setDeleteDialog({
      open: true,
      serviceId,
      serviceName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.serviceId) return;

    try {
      const { error } = await supabase
        .from("contractor_services")
        .delete()
        .eq("id", deleteDialog.serviceId);

      if (error) throw error;

      setExistingServices(
        existingServices.filter((s) => s.id !== deleteDialog.serviceId)
      );
      setDeleteDialog({ open: false, serviceId: null, serviceName: null });
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service.");
    }
  };

  const openEditDialog = (service: ExistingService) => {
    setEditForm({
      priceMin: service.price_range_min?.toString() || "",
      priceMax: service.price_range_max?.toString() || "",
      description: service.description || "",
    });
    setEditDialog({ open: true, service });
  };

  const handleUpdateService = async () => {
    if (!editDialog.service) return;

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("contractor_services")
        .update({
          price_range_min: parseFloat(editForm.priceMin) || null,
          price_range_max: parseFloat(editForm.priceMax) || null,
          description: editForm.description || null,
        })
        .eq("id", editDialog.service.id);

      if (error) throw error;

      // Update local state
      setExistingServices(
        existingServices.map((s) =>
          s.id === editDialog.service!.id
            ? {
                ...s,
                price_range_min: parseFloat(editForm.priceMin) || null,
                price_range_max: parseFloat(editForm.priceMax) || null,
                description: editForm.description || null,
              }
            : s
        )
      );

      setEditDialog({ open: false, service: null });
    } catch (error) {
      console.error("Error updating service:", error);
      alert("Failed to update service.");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateService = (categoryId: string, field: string, value: string) => {
    setSelectedServices(
      selectedServices.map((s) =>
        s.categoryId === categoryId ? { ...s, [field]: value } : s
      )
    );
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      alert("Please add at least one service");
      return;
    }

    setIsLoading(true);

    try {
      const servicesToInsert = selectedServices.map((s) => ({
        contractor_id: contractorId,
        category_id: s.categoryId,
        price_range_min: parseFloat(s.priceMin) || null,
        price_range_max: parseFloat(s.priceMax) || null,
        description: s.description || null,
      }));

      const { error } = await supabase
        .from("contractor_services")
        .insert(servicesToInsert);

      if (error) throw error;

      router.push("/dashboard/contractor");
    } catch (error) {
      console.error("Error adding services:", error);
      alert("Failed to add services. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Manage Your Services
          </h1>
          <p className="text-zinc-400">
            Add or update the services you offer to customers
          </p>
        </div>

        {/* Existing Services Section */}
        {existingServices.length > 0 && (
          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                Your Active Services ({existingServices.length})
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {existingServices.map((service) => (
                <div
                  key={service.id}
                  className="group relative p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">
                        {service.service_categories?.name || "Unknown Service"}
                      </h3>
                      {(service.price_range_min || service.price_range_max) && (
                        <p className="text-sm text-green-400 font-medium">
                          RM {service.price_range_min || "0"} - RM{" "}
                          {service.price_range_max || "0"}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditDialog(service)}
                        className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-500/10 rounded"
                        title="Edit service"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          openDeleteDialog(
                            service.id,
                            service.service_categories?.name || "this service"
                          )
                        }
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/10 rounded"
                        title="Delete service"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {service.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Add New Services Section */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Available Categories */}
          <Card className="lg:col-span-2 p-6 bg-white/5 border-white/10">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white mb-3">
                Available Services
              </h2>
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2 max-h-150 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p>No services found</p>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const alreadyAdded = isServiceAlreadyAdded(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => addService(cat)}
                      disabled={alreadyAdded}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-all",
                        alreadyAdded
                          ? "border-green-500/20 bg-green-500/5 cursor-not-allowed"
                          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white flex items-center gap-2">
                            {cat.name}
                            {alreadyAdded && (
                              <Check className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          {cat.description && (
                            <div className="text-xs text-zinc-400 mt-1 line-clamp-2">
                              {cat.description}
                            </div>
                          )}
                        </div>
                        {!alreadyAdded && (
                          <Plus className="h-5 w-5 text-purple-400 shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Selected New Services */}
          <Card className="lg:col-span-3 p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">
              New Services to Add ({selectedServices.length})
            </h2>
            <div className="space-y-4 max-h-150 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {selectedServices.length === 0 ? (
                <div className="text-center py-16 text-zinc-500">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
                    <Plus className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-lg font-medium text-white mb-1">
                    No services selected
                  </p>
                  <p className="text-sm">
                    Choose services from the list to get started
                  </p>
                </div>
              ) : (
                selectedServices.map((service) => (
                  <div
                    key={service.categoryId}
                    className="p-5 rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-500/5 to-transparent"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-white text-lg">
                        {service.categoryName}
                      </h3>
                      <button
                        onClick={() => removeService(service.categoryId)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/10 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-zinc-400 mb-1.5 block">
                            Min Price (RM)
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                              RM
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={service.priceMin}
                              onChange={(e) =>
                                updateService(
                                  service.categoryId,
                                  "priceMin",
                                  e.target.value
                                )
                              }
                              className="bg-white/5 border-white/10 text-white pl-11"
                              placeholder="100.00"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400 mb-1.5 block">
                            Max Price (RM)
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                              RM
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              value={service.priceMax}
                              onChange={(e) =>
                                updateService(
                                  service.categoryId,
                                  "priceMax",
                                  e.target.value
                                )
                              }
                              className="bg-white/5 border-white/10 text-white pl-11"
                              placeholder="500.00"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-zinc-400 mb-1.5 block">
                          Service Description
                        </Label>
                        <Textarea
                          value={service.description}
                          onChange={(e) =>
                            updateService(
                              service.categoryId,
                              "description",
                              e.target.value
                            )
                          }
                          className="bg-white/5 border-white/10 text-white min-h-20 resize-none"
                          placeholder="Describe what you offer for this service..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedServices.length > 0 && (
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-12 text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving Services...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Save {selectedServices.length} Service
                      {selectedServices.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/contractor")}
                  className="border-white/10 text-white hover:bg-white/5 h-12"
                >
                  Done
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, serviceId: null, serviceName: null })
        }
      >
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Service
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-white">
                {deleteDialog.serviceName}
              </span>{" "}
              from your services? This action cannot be undone.
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

      {/* Edit Service Dialog */}
      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, service: null })}
      >
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Service</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Update pricing and description for{" "}
              {editDialog.service?.service_categories?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300 text-sm">Min Price (RM)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    RM
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.priceMin}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priceMin: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white pl-11"
                    placeholder="100.00"
                  />
                </div>
              </div>
              <div>
                <Label className="text-zinc-300 text-sm">Max Price (RM)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                    RM
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.priceMax}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priceMax: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white pl-11"
                    placeholder="500.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 text-sm">Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                className="bg-white/5 border-white/10 text-white min-h-25 resize-none mt-1.5"
                placeholder="Describe your service..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: false, service: null })}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateService}
              disabled={isUpdating}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
