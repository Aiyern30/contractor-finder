"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, X } from "lucide-react";

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

export default function AddServicesPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [contractorId, setContractorId] = useState<string>("");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);

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

  const addService = (category: ServiceCategory) => {
    if (selectedServices.find((s) => s.categoryId === category.id)) return;

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
    setSelectedServices(selectedServices.filter((s) => s.categoryId !== categoryId));
  };

  const updateService = (categoryId: string, field: string, value: string) => {
    setSelectedServices(
      selectedServices.map((s) =>
        s.categoryId === categoryId ? { ...s, [field]: value } : s
      )
    );
  };

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
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Add Your Services</h1>
          <p className="text-zinc-400">
            Select the services you offer and set your pricing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Available Categories */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">
              Available Services
            </h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => addService(cat)}
                  disabled={selectedServices.some((s) => s.categoryId === cat.id)}
                  className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-white">{cat.name}</div>
                  {cat.description && (
                    <div className="text-xs text-zinc-400 mt-1">
                      {cat.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </Card>

          {/* Selected Services */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">
              Your Services ({selectedServices.length})
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {selectedServices.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No services added yet</p>
                  <p className="text-sm">Select services from the left</p>
                </div>
              ) : (
                selectedServices.map((service) => (
                  <div
                    key={service.categoryId}
                    className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white">
                        {service.categoryName}
                      </h3>
                      <button
                        onClick={() => removeService(service.categoryId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-zinc-400">Min Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={service.priceMin}
                            onChange={(e) =>
                              updateService(service.categoryId, "priceMin", e.target.value)
                            }
                            className="bg-white/5 border-white/10 text-white h-8 text-sm"
                            placeholder="100"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Max Price ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={service.priceMax}
                            onChange={(e) =>
                              updateService(service.categoryId, "priceMax", e.target.value)
                            }
                            className="bg-white/5 border-white/10 text-white h-8 text-sm"
                            placeholder="500"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-zinc-400">Description</Label>
                        <Textarea
                          value={service.description}
                          onChange={(e) =>
                            updateService(
                              service.categoryId,
                              "description",
                              e.target.value
                            )
                          }
                          className="bg-white/5 border-white/10 text-white text-sm min-h-[60px]"
                          placeholder="Describe your service..."
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedServices.length > 0 && (
              <div className="mt-6 space-y-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Services...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/contractor")}
                  className="w-full border-white/10 text-white hover:bg-white/5"
                >
                  Skip for Now
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
