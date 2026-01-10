"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Filter,
  Briefcase,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface JobRequest {
  id: string;
  title: string;
  description: string;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_date: string | null;
  urgency: string | null;
  status: string;
  created_at: string;
  category_id: string;
  service_categories: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

interface Quote {
  id: string;
  quoted_price: number;
  estimated_duration: string | null;
  status: string;
  created_at: string;
  job_requests: JobRequest;
}

interface Filters {
  urgency: string;
  budgetMin: string;
  budgetMax: string;
  category: string;
  location: string;
  dateRange: string;
}

export default function ContractorJobsPage() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [availableJobs, setAvailableJobs] = useState<JobRequest[]>([]);
  const [myQuotes, setMyQuotes] = useState<Quote[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available");
  const [filters, setFilters] = useState<Filters>({
    urgency: "all",
    budgetMin: "",
    budgetMax: "",
    category: "all",
    location: "",
    dateRange: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const loadData = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push("/");
        return;
      }

      // Get contractor profile
      const { data: profile } = await supabase
        .from("contractor_profiles")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!profile) {
        router.push("/dashboard/contractor/setup");
        return;
      }

      // Load contractor's service categories
      const { data: services } = await supabase
        .from("contractor_services")
        .select("category_id")
        .eq("contractor_id", profile.id);

      const categoryIds = services?.map((s) => s.category_id) || [];

      // Load contractor's quotes/bids first
      const { data: quotes } = await supabase
        .from("quotes")
        .select(
          `
          *,
          job_requests (
            *,
            service_categories (name),
            profiles (full_name)
          )
        `
        )
        .eq("contractor_id", profile.id)
        .order("created_at", { ascending: false });

      setMyQuotes(quotes || []);

      // Get job IDs that contractor has already quoted on
      const quotedJobIds = quotes?.map((q) => q.job_request_id) || [];

      if (categoryIds.length > 0) {
        // Load available jobs matching contractor's services
        // EXCLUDE jobs they've already quoted on
        let query = supabase
          .from("job_requests")
          .select(
            `
            *,
            service_categories (name),
            profiles (full_name)
          `
          )
          .eq("status", "open")
          .in("category_id", categoryIds)
          .order("created_at", { ascending: false });

        // Only add the not-in filter if there are quoted jobs
        if (quotedJobIds.length > 0) {
          query = query.not("id", "in", `(${quotedJobIds.join(",")})`);
        }

        const { data: jobs } = await query;

        setAvailableJobs(jobs || []);
      }

      // Load categories for filter dropdown
      const { data: cats } = await supabase
        .from("service_categories")
        .select("id, name")
        .order("name");

      setCategories(cats || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply filters to jobs
  const applyFilters = useCallback((jobs: JobRequest[]) => {
    return jobs.filter((job) => {
      // Search query filter
      const matchesSearch =
        searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.service_categories.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Urgency filter
      const matchesUrgency =
        filters.urgency === "all" || job.urgency === filters.urgency;

      // Budget filter
      const matchesBudget =
        (filters.budgetMin === "" || (job.budget_max && job.budget_max >= parseFloat(filters.budgetMin))) &&
        (filters.budgetMax === "" || (job.budget_min && job.budget_min <= parseFloat(filters.budgetMax)));

      // Category filter
      const matchesCategory =
        filters.category === "all" || job.category_id === filters.category;

      // Location filter
      const matchesLocation =
        filters.location === "" ||
        (job.location && job.location.toLowerCase().includes(filters.location.toLowerCase()));

      // Date range filter
      const matchesDateRange = (() => {
        if (filters.dateRange === "all" || !job.created_at) return true;
        const jobDate = new Date(job.created_at);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case "today":
            return diffDays === 0;
          case "week":
            return diffDays <= 7;
          case "month":
            return diffDays <= 30;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesUrgency && matchesBudget && matchesCategory && matchesLocation && matchesDateRange;
    });
  }, [searchQuery, filters]);

  const filteredAvailableJobs = applyFilters(availableJobs);

  const filteredMyQuotes = myQuotes.filter(
    (quote) =>
      quote.job_requests.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.job_requests.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetFilters = () => {
    setFilters({
      urgency: "all",
      budgetMin: "",
      budgetMax: "",
      category: "all",
      location: "",
      dateRange: "all",
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "urgency" || key === "category" || key === "dateRange") {
      return value !== "all";
    }
    return value !== "";
  }).length;

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "withdrawn":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Jobs & Opportunities
        </h1>
        <p className="text-zinc-400">
          Browse available jobs and manage your bids
        </p>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-white/5 border-white/10 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <Input
              placeholder="Search jobs by title, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
            />
          </div>
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 hover:text-white relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-zinc-900 border-zinc-800 text-white" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                {/* Urgency Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Urgency</Label>
                  <Select value={filters.urgency} onValueChange={(value) => setFilters({ ...filters, urgency: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">All Urgencies</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Budget Range (RM)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.budgetMin}
                      onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.budgetMax}
                      onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Service Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Location</Label>
                  <Input
                    placeholder="Enter city or area..."
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                  />
                </div>

                {/* Date Posted Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-zinc-300">Posted</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="all">Any Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Past Week</SelectItem>
                      <SelectItem value="month">Past Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger
            value="available"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=inactive]:text-zinc-400"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Available Jobs ({filteredAvailableJobs.length})
          </TabsTrigger>
          <TabsTrigger
            value="my-bids"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=inactive]:text-zinc-400"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            My Bids ({filteredMyQuotes.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Jobs Tab */}
        <TabsContent value="available" className="space-y-4">
          {filteredAvailableJobs.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <Briefcase className="h-16 w-16 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Available Jobs
              </h3>
              <p className="text-zinc-400">
                Check back later for new job opportunities matching your
                services
              </p>
            </Card>
          ) : (
            filteredAvailableJobs.map((job) => (
              <Card
                key={job.id}
                className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/contractor/jobs/${job.id}`)
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {job.title}
                      </h3>
                      {job.urgency && (
                        <Badge className={getUrgencyColor(job.urgency)}>
                          {job.urgency.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">
                      Posted by {job.profiles.full_name} •{" "}
                      {getTimeAgo(job.created_at)}
                    </p>
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      {job.service_categories.name}
                    </Badge>
                  </div>
                </div>

                <p className="text-zinc-300 mb-4 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
                  {job.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                  )}
                  {(job.budget_min || job.budget_max) && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Budget: RM {job.budget_min || "0"} - RM{" "}
                      {job.budget_max || "N/A"}
                    </div>
                  )}
                  {job.preferred_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Preferred:{" "}
                      {new Date(job.preferred_date).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/contractor/jobs/${job.id}`);
                    }}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    View Details & Submit Quote
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* My Bids Tab */}
        <TabsContent value="my-bids" className="space-y-4">
          {filteredMyQuotes.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <CheckCircle className="h-16 w-16 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Bids Yet
              </h3>
              <p className="text-zinc-400">
                Start bidding on available jobs to grow your business
              </p>
            </Card>
          ) : (
            filteredMyQuotes.map((quote) => (
              <Card
                key={quote.id}
                className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {quote.job_requests.title}
                      </h3>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400">
                      Quote submitted {getTimeAgo(quote.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">
                      RM {quote.quoted_price.toLocaleString()}
                    </p>
                    {quote.estimated_duration && (
                      <p className="text-sm text-zinc-400 flex items-center gap-1 justify-end mt-1">
                        <Clock className="h-4 w-4" />
                        {quote.estimated_duration}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-zinc-300 mb-4 line-clamp-2">
                  {quote.job_requests.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex gap-4 text-sm text-zinc-400">
                    {quote.job_requests.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {quote.job_requests.location}
                      </div>
                    )}
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                      {quote.job_requests.service_categories.name}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(
                        `/dashboard/contractor/jobs/${quote.job_requests.id}`
                      )
                    }
                    className="border-white/10 text-white hover:bg-white/5"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
