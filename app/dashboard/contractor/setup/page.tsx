"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, MapPin, DollarSign } from "lucide-react";

export default function ContractorSetupPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const [formData, setFormData] = useState({
    businessName: "",
    bio: "",
    yearsExperience: "",
    licenseNumber: "",
    address: "",
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
          license_number: formData.licenseNumber || null,
          address: formData.address || null,
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
            Complete your profile to start receiving job requests
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
                  <div>
                    <Label htmlFor="businessName" className="text-zinc-300">
                      Business Name *
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
                      placeholder="e.g., Smith Plumbing Services"
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
                      placeholder="Tell customers about your business..."
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

                    <div>
                      <Label htmlFor="licenseNumber" className="text-zinc-300">
                        License Number
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
                        placeholder="e.g., CA-12345"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-400" />
                  Service Location
                </h2>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="address" className="text-zinc-300">
                      Street Address
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-zinc-300">
                        City
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="San Francisco"
                      />
                    </div>

                    <div>
                      <Label htmlFor="state" className="text-zinc-300">
                        State
                      </Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="CA"
                      />
                    </div>

                    <div>
                      <Label htmlFor="zipCode" className="text-zinc-300">
                        ZIP Code
                      </Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) =>
                          setFormData({ ...formData, zipCode: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="94103"
                      />
                    </div>
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
                      Hourly Rate ($)
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) =>
                        setFormData({ ...formData, hourlyRate: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="75.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minProjectSize" className="text-zinc-300">
                      Minimum Project Size ($)
                    </Label>
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
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="500.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.businessName}
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
