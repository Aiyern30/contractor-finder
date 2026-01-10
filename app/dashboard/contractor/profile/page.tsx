/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { ContractorLayout } from "@/components/layout/contractor-layout";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X, Loader2, MapPin } from "lucide-react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  DollarSign,
  Calendar,
  Briefcase,
  Star,
  Award,
  Shield,
  Clock,
  User,
  Building2,
} from "lucide-react";

import { toast } from "sonner";

interface ContractorProfile {
  id: string;
  user_id: string;
  business_name: string;
  bio: string | null;
  years_experience: number | null;
  license_number: string | null;
  insurance_verified: boolean;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  hourly_rate: number | null;
  min_project_size: number | null;
  status: string;
  avg_rating: number;
  total_reviews: number;
  total_jobs: number;
  created_at: string;
}

interface ContractorService {
  id: string;
  category_id: string;
  price_range_min: number | null;
  price_range_max: number | null;
  description: string | null;
  service_categories: {
    name: string;
  };
}

export default function ContractorProfilePage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Only need contractor profile and auth user
  const [user, setUser] = useState<any>(null);
  const [contractorProfile, setContractorProfile] =
    useState<ContractorProfile | null>(null);
  const [services, setServices] = useState<ContractorService[]>([]);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    business_name: "",
    bio: "",
    years_experience: "",
    license_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    hourly_rate: "",
    min_project_size: "",
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

      // Check user type from auth metadata
      const userType = session.user.user_metadata?.user_type;
      if (userType !== "contractor") {
        toast.error("Access Denied", {
          description: "This page is only for contractors",
        });
        router.push("/dashboard");
        return;
      }

      setUser(session.user);

      // Load contractor profile
      const { data: contractorData, error: contractorError } = await supabase
        .from("contractor_profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (contractorError) {
        if (contractorError.code === "PGRST116") {
          router.push("/dashboard/contractor/setup");
          return;
        }
        throw contractorError;
      }

      setContractorProfile(contractorData);

      // Load contractor services
      const { data: servicesData } = await supabase
        .from("contractor_services")
        .select(`*, service_categories (name)`)
        .eq("contractor_id", contractorData.id);

      setServices((servicesData as ContractorService[]) || []);

      // Set form data from auth user metadata and contractor profile
      setFormData({
        full_name: session.user.user_metadata?.full_name || "",
        phone: session.user.user_metadata?.phone || "",
        business_name: contractorData.business_name || "",
        bio: contractorData.bio || "",
        years_experience: contractorData.years_experience?.toString() || "",
        license_number: contractorData.license_number || "",
        address: contractorData.address || "",
        city: contractorData.city || "",
        state: contractorData.state || "",
        zip_code: contractorData.zip_code || "",
        hourly_rate: contractorData.hourly_rate?.toString() || "",
        min_project_size: contractorData.min_project_size?.toString() || "",
      });
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Loading Failed", {
        description: "Failed to load profile data",
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!user || !contractorProfile) return;

    setIsSaving(true);
    const toastId = toast.loading("Saving profile...");

    try {
      // Update auth user metadata (for name and phone)
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        },
      });

      if (updateError) throw updateError;

      // Update contractor profile
      const { error: contractorError } = await supabase
        .from("contractor_profiles")
        .update({
          business_name: formData.business_name,
          bio: formData.bio || null,
          years_experience: formData.years_experience
            ? parseInt(formData.years_experience)
            : null,
          license_number: formData.license_number || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          hourly_rate: formData.hourly_rate
            ? parseFloat(formData.hourly_rate)
            : null,
          min_project_size: formData.min_project_size
            ? parseFloat(formData.min_project_size)
            : null,
        })
        .eq("id", contractorProfile.id);

      if (contractorError) throw contractorError;

      toast.success("Profile Updated!", {
        description: "Your profile has been updated successfully",
        id: toastId,
      });

      await loadData();
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Save Failed", {
        description: "Failed to save profile changes",
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!user || !contractorProfile) return;

    setFormData({
      full_name: user.user_metadata?.full_name || "",
      phone: user.user_metadata?.phone || "",
      business_name: contractorProfile.business_name || "",
      bio: contractorProfile.bio || "",
      years_experience: contractorProfile.years_experience?.toString() || "",
      license_number: contractorProfile.license_number || "",
      address: contractorProfile.address || "",
      city: contractorProfile.city || "",
      state: contractorProfile.state || "",
      zip_code: contractorProfile.zip_code || "",
      hourly_rate: contractorProfile.hourly_rate?.toString() || "",
      min_project_size: contractorProfile.min_project_size?.toString() || "",
    });

    setIsEditMode(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "suspended":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user || !contractorProfile) {
    return (
      <ContractorLayout
        title="Profile Not Found"
        description="Unable to load profile information"
      >
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">
              Profile Not Found
            </h2>
            <Button onClick={() => router.push("/dashboard/contractor")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </ContractorLayout>
    );
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  const headerActions = isEditMode ? (
    <>
      <Button
        onClick={cancelEdit}
        variant="outline"
        size="sm"
        disabled={isSaving}
        className="hidden sm:flex"
      >
        <X className="h-4 w-4 mr-2" />
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        disabled={isSaving}
        size="sm"
        className="bg-purple-500 hover:bg-purple-600"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Save</span>
          </>
        )}
      </Button>
    </>
  ) : (
    <Button
      onClick={() => setIsEditMode(true)}
      size="sm"
      className="bg-blue-500 hover:bg-blue-600"
    >
      <Edit2 className="h-4 w-4 md:mr-2" />
      <span className="hidden md:inline">Edit Profile</span>
    </Button>
  );

  return (
    <ContractorLayout
      title="My Profile"
      description="Manage your contractor profile and settings"
      badge={{
        text: contractorProfile.status.toUpperCase(),
        variant:
          contractorProfile.status === "approved"
            ? "green"
            : contractorProfile.status === "pending"
            ? "yellow"
            : "red",
      }}
      actions={headerActions}
    >
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="text-center">
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="text-xl font-bold text-white mb-1">
                  {displayName}
                </h2>
                <p className="text-sm text-zinc-400 mb-1">{user.email}</p>
                <p className="text-xs text-zinc-500 mb-3">
                  {contractorProfile.business_name}
                </p>
                <Badge className={getStatusColor(contractorProfile.status)}>
                  {contractorProfile.status.toUpperCase()}
                </Badge>
              </div>
            </Card>

            {/* Stats Cards */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Performance Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-zinc-400">Rating</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {contractorProfile.avg_rating > 0
                      ? contractorProfile.avg_rating.toFixed(1)
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-zinc-400">
                      Completed Jobs
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {contractorProfile.total_jobs}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-zinc-400">Total Reviews</span>
                  </div>
                  <span className="text-lg font-semibold text-white">
                    {contractorProfile.total_reviews}
                  </span>
                </div>
                {contractorProfile.years_experience && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-zinc-400">Experience</span>
                    </div>
                    <span className="text-lg font-semibold text-white">
                      {contractorProfile.years_experience}{" "}
                      {contractorProfile.years_experience === 1
                        ? "year"
                        : "years"}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Verification Status */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                Verification
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-zinc-400">Insurance</span>
                  </div>
                  <Badge
                    className={
                      contractorProfile.insurance_verified
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }
                  >
                    {contractorProfile.insurance_verified
                      ? "Verified"
                      : "Not Verified"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-400" />
                    <span className="text-sm text-zinc-400">License</span>
                  </div>
                  <Badge
                    className={
                      contractorProfile.license_number
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }
                  >
                    {contractorProfile.license_number
                      ? "Provided"
                      : "Not Provided"}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <User className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">
                  Personal Information
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Full Name
                  </Label>
                  {isEditMode ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Your full name"
                    />
                  ) : (
                    <p className="text-white">{displayName}</p>
                  )}
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Phone Number
                  </Label>
                  {isEditMode ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="+60 12 345 6789"
                    />
                  ) : (
                    <p className="text-white">
                      {user.user_metadata?.phone || "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Email
                  </Label>
                  <p className="text-white">{user.email}</p>
                  <span className="text-xs text-zinc-500">
                    Cannot be changed
                  </span>
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Account Type
                  </Label>
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                    CONTRACTOR
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Business Information */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">
                  Business Information
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Business Name *
                  </Label>
                  {isEditMode ? (
                    <Input
                      value={formData.business_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          business_name: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Your business name"
                    />
                  ) : (
                    <p className="text-white">
                      {contractorProfile.business_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Bio / Description
                  </Label>
                  {isEditMode ? (
                    <Textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="min-h-24 bg-white/5 border-white/10 text-white"
                      placeholder="Tell customers about your business and expertise..."
                    />
                  ) : (
                    <p className="text-white whitespace-pre-wrap">
                      {contractorProfile.bio || "No bio provided"}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-zinc-300 text-sm mb-1.5 block">
                      Years of Experience
                    </Label>
                    {isEditMode ? (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.years_experience}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            years_experience: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="5"
                      />
                    ) : (
                      <p className="text-white">
                        {contractorProfile.years_experience
                          ? `${contractorProfile.years_experience} ${
                              contractorProfile.years_experience === 1
                                ? "year"
                                : "years"
                            }`
                          : "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-zinc-300 text-sm mb-1.5 block">
                      License Number
                    </Label>
                    {isEditMode ? (
                      <Input
                        value={formData.license_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            license_number: e.target.value,
                          })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="ABC123456"
                      />
                    ) : (
                      <p className="text-white">
                        {contractorProfile.license_number || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Location Information */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Location</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Street Address
                  </Label>
                  {isEditMode ? (
                    <Input
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="123 Main Street"
                    />
                  ) : (
                    <p className="text-white">
                      {contractorProfile.address || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-zinc-300 text-sm mb-1.5 block">
                      City
                    </Label>
                    {isEditMode ? (
                      <Input
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Kuala Lumpur"
                      />
                    ) : (
                      <p className="text-white">
                        {contractorProfile.city || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-zinc-300 text-sm mb-1.5 block">
                      State
                    </Label>
                    {isEditMode ? (
                      <Input
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Selangor"
                      />
                    ) : (
                      <p className="text-white">
                        {contractorProfile.state || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-zinc-300 text-sm mb-1.5 block">
                      Zip Code
                    </Label>
                    {isEditMode ? (
                      <Input
                        value={formData.zip_code}
                        onChange={(e) =>
                          setFormData({ ...formData, zip_code: e.target.value })
                        }
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="50000"
                      />
                    ) : (
                      <p className="text-white">
                        {contractorProfile.zip_code || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Pricing Information */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="h-5 w-5 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Pricing</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Hourly Rate (RM)
                  </Label>
                  {isEditMode ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourly_rate: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="150.00"
                    />
                  ) : (
                    <p className="text-white">
                      {contractorProfile.hourly_rate
                        ? `RM ${contractorProfile.hourly_rate.toFixed(2)}/hour`
                        : "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Minimum Project Size (RM)
                  </Label>
                  {isEditMode ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min_project_size}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_project_size: e.target.value,
                        })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="500.00"
                    />
                  ) : (
                    <p className="text-white">
                      {contractorProfile.min_project_size
                        ? `RM ${contractorProfile.min_project_size.toFixed(2)}`
                        : "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Services */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">
                    Services Offered
                  </h3>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push("/dashboard/contractor/setup")}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Manage Services
                </Button>
              </div>

              {services.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">
                  No services added yet. Add services to get more job
                  opportunities.
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <h4 className="font-semibold text-white mb-2">
                        {service.service_categories.name}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-zinc-400 mb-2">
                          {service.description}
                        </p>
                      )}
                      {(service.price_range_min || service.price_range_max) && (
                        <p className="text-sm text-purple-400">
                          RM {service.price_range_min || "0"} - RM{" "}
                          {service.price_range_max || "0"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Account Created */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-zinc-400" />
                <p className="text-sm text-zinc-400">
                  Member since{" "}
                  {new Date(contractorProfile.created_at).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ContractorLayout>
  );
}
