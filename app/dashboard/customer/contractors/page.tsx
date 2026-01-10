"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/user-nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, DollarSign, Star, Loader2 } from "lucide-react";
import { debounce } from "lodash";

interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  avatar?: string;
}

interface Specialty {
  id: string;
  name: string;
}

export default function ContractorsPage() {
  const router = useRouter();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [minRating, setMinRating] = useState("");

  // Fetch specialties on mount
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await fetch("/api/contractors/specialties");
        if (response.ok) {
          const data = await response.json();
          setSpecialties(data);
        }
      } catch (error) {
        console.error("Error fetching specialties:", error);
      }
    };

    fetchSpecialties();
  }, []);

  // Debounced fetch function (define once, not inside useCallback)
  const debouncedFetch = debounce(
    (filters: {
      search: string;
      specialty: string;
      location: string;
      maxRate: string;
      minRating: string;
    }) => {
      setLoading(true);
      (async () => {
        try {
          const params = new URLSearchParams();
          if (filters.search) params.append("search", filters.search);
          if (filters.specialty) params.append("specialty", filters.specialty);
          if (filters.location) params.append("location", filters.location);
          if (filters.maxRate) params.append("maxRate", filters.maxRate);
          if (filters.minRating) params.append("minRating", filters.minRating);

          const response = await fetch(
            `/api/contractors?${params.toString()}`
          );
          if (response.ok) {
            const data = await response.json();
            setContractors(data);
          }
        } catch (error) {
          console.error("Error fetching contractors:", error);
        } finally {
          setLoading(false);
        }
      })();
    },
    500
  );

  // Fetch contractors when filters change
  useEffect(() => {
    debouncedFetch({
      search: searchTerm,
      specialty: specialtyFilter,
      location: locationFilter,
      maxRate,
      minRating,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, specialtyFilter, locationFilter, maxRate, minRating]);

  const viewProfile = (contractorId: string) => {
    router.push(`/dashboard/customer/contractors/${contractorId}`);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold text-white">Find Contractors</h2>
          </div>
          <UserNav />
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Search and Filters */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
              <Input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Specialty Select */}
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="h-11 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Specialties" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="all" className="text-white">
                  All Specialties
                </SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem
                    key={specialty.id}
                    value={specialty.name}
                    className="text-white"
                  >
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Input */}
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
              <Input
                type="text"
                placeholder="Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Max Rate Input */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
              <Input
                type="number"
                placeholder="Max Rate (RM/hr)"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Min Rating Input */}
            <div className="relative">
              <Star className="absolute left-3 top-2.5 h-5 w-5 text-zinc-500" />
              <Input
                type="number"
                placeholder="Min Rating"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                min="0"
                max="5"
                step="0.5"
                className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-zinc-400">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching contractors...
              </span>
            ) : (
              <>
                {contractors.length} contractor
                {contractors.length !== 1 ? "s" : ""} found
              </>
            )}
          </p>
        </div>

        {/* Contractors Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : contractors.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
              <Search className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-lg font-medium text-white mb-2">
              No contractors found
            </p>
            <p className="text-zinc-400">
              Try adjusting your search filters or check back later
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractors.map((contractor) => (
              <Card
                key={contractor.id}
                className="group p-6 bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => viewProfile(contractor.id)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {contractor.name.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-xl font-semibold text-white group-hover:text-purple-400 transition-colors">
                      {contractor.name}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {contractor.specialty}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-zinc-400">
                    <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                    {contractor.location}
                  </div>
                  <div className="flex items-center text-sm text-green-400 font-medium">
                    <DollarSign className="h-4 w-4 mr-2" />
                    RM {contractor.hourlyRate}/hour
                  </div>
                  <div className="flex items-center text-sm">
                    <Star className="h-4 w-4 mr-2 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-medium">
                      {contractor.rating.toFixed(1)}
                    </span>
                    <span className="text-zinc-400 ml-1">
                      ({contractor.reviewCount} reviews)
                    </span>
                  </div>
                </div>

                <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                  View Profile
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
