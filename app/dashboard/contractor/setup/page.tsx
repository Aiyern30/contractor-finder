/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Building2, MapPin, DollarSign, User } from "lucide-react";
import { MALAYSIA_STATES, MALAYSIA_CITIES } from "@/lib/constants/malaysia";

export default function ContractorSetupPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isFreelance, setIsFreelance] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    businessName: "",
    bio: "",
    yearsExperience: "",
    licenseNumber: "",
    city: "",
    state: "",
    zipCode: "",
    hourlyRate: "",
    minProjectSize: "",
  });

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/");
        return;
      }

      setUserId(session.user.id);

      // Check if profile already exists
      const { data: existing } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (existing) {
        router.push("/dashboard/contractor");
      }
    }

    checkUser();
  }, [supabase, router]);

  // Update available cities when state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableCities(MALAYSIA_CITIES[selectedState] || []);
      // Reset city when state changes
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  }, [selectedState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Insert contractor profile
      const { error: profileError } = await supabase
        .from("contractor_profiles")
        .insert({
          user_id: userId,
          business_name: formData.businessName,
          bio: formData.bio,
          years_experience: parseInt(formData.yearsExperience) || null,
          license_number: isFreelance ? null : formData.licenseNumber || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zipCode || null,
          hourly_rate: parseFloat(formData.hourlyRate) || null,
          min_project_size: parseFloat(formData.minProjectSize) || null,
          status: "pending",
        });

      if (profileError) throw profileError;

      // Redirect to services setup
      router.push("/dashboard/contractor/services/add");
    } catch (error) {
      console.error("Error creating profile:", error);
      alert("Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Set Up Your Contractor Profile
          </h1>
          <p className="text-zinc-400">
            Complete your profile to start receiving job requests in Malaysia
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-8 bg-white/5 border-white/10">
            <div className="space-y-6">
              {/* Business Information */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-400" />
                  Business Information
                </h2>
                <div className="grid gap-4">
                  {/* Freelance Toggle */}
                  <div className="flex items-center space-x-2 p-4 rounded-lg border border-white/10 bg-white/5">
                    <Checkbox
                      id="freelance"
                      checked={isFreelance}
                      onCheckedChange={(checked) =>
                        setIsFreelance(checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="freelance"
                        className="text-sm font-medium text-white cursor-pointer flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        I'm a freelancer / individual contractor
                      </label>
                      <p className="text-xs text-zinc-500 mt-1">
                        You don't need a business license to offer services
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessName" className="text-zinc-300">
                      {isFreelance
                        ? "Your Name / Business Name *"
                        : "Business Name *"}
                    </Label>
                    <Input
                      id="businessName"
                      required
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessName: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder={
                        isFreelance
                          ? "e.g., Ahmad bin Ali"
                          : "e.g., Smith Plumbing Services"
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-zinc-300">
                      Bio / Description
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white min-h-25"
                      placeholder="Tell customers about your business and experience..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="yearsExperience"
                        className="text-zinc-300"
                      >
                        Years of Experience
                      </Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        value={formData.yearsExperience}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            yearsExperience: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="e.g., 10"
                      />
                    </div>

                    {!isFreelance && (
                      <div>
                        <Label
                          htmlFor="licenseNumber"
                          className="text-zinc-300"
                        >
                          Business License Number
                        </Label>
                        <Input
                          id="licenseNumber"
                          value={formData.licenseNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              licenseNumber: e.target.value,
                            })
                          }
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="e.g., SSM-12345678"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Location */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                  Service Location (Malaysia)
                </h2>
                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state" className="text-zinc-300">
                        State *
                      </Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value: any) => {
                          setSelectedState(value);
                          setFormData({ ...formData, state: value });
                        }}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          {MALAYSIA_STATES.map((state) => (
                            <SelectItem
                              key={state.value}
                              value={state.value}
                              className="text-white"
                            >
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-zinc-300">
                        City *
                      </Label>
                      <Select
                        value={formData.city}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, city: value })
                        }
                        disabled={!selectedState}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white disabled:opacity-50">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10">
                          {availableCities.map((city) => (
                            <SelectItem
                              key={city}
                              value={city}
                              className="text-white"
                            >
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="zipCode" className="text-zinc-300">
                      Postcode
                    </Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) =>
                        setFormData({ ...formData, zipCode: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g., 50000"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  Pricing Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate" className="text-zinc-300">
                      Hourly Rate (RM)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        RM
                      </span>
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="0.01"
                        value={formData.hourlyRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hourlyRate: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white pl-12"
                        placeholder="150.00"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="minProjectSize" className="text-zinc-300">
                      Minimum Project Size (RM)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                        RM
                      </span>
                      <Input
                        id="minProjectSize"
                        type="number"
                        step="0.01"
                        value={formData.minProjectSize}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minProjectSize: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white pl-12"
                        placeholder="500.00"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  * All prices are in Malaysian Ringgit (RM)
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !formData.businessName ||
                    !formData.state ||
                    !formData.city
                  }
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    "Continue to Services"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
