"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

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

export default function ContractorsPage() {
  const router = useRouter();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [minRating, setMinRating] = useState("");

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const response = await fetch("/api/contractors");
        if (response.ok) {
          const data = await response.json();
          setContractors(data);
        }
      } catch (error) {
        console.error("Error fetching contractors:", error);
      }
    };

    fetchContractors();
  }, []);

  const filteredContractors = useMemo(() => {
    let filtered = contractors;

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specialtyFilter) {
      filtered = filtered.filter((c) => c.specialty === specialtyFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter((c) =>
        c.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (maxRate) {
      filtered = filtered.filter((c) => c.hourlyRate <= parseFloat(maxRate));
    }

    if (minRating) {
      filtered = filtered.filter((c) => c.rating >= parseFloat(minRating));
    }

    return filtered;
  }, [
    contractors,
    searchTerm,
    specialtyFilter,
    locationFilter,
    maxRate,
    minRating,
  ]);

  const viewProfile = (contractorId: string) => {
    router.push(`/customer/contractors/${contractorId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Find Contractors</h1>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specialties</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Carpentry">Carpentry</option>
              <option value="Painting">Painting</option>
              <option value="HVAC">HVAC</option>
            </select>
            <input
              type="text"
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Rate ($/hr)"
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Min Rating"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              min="0"
              max="5"
              step="0.5"
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-600 mb-4">
          {filteredContractors.length} contractors found
        </p>

        {/* Contractors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContractors.map((contractor) => (
            <div
              key={contractor.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {contractor.name.charAt(0)}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">{contractor.name}</h3>
                  <p className="text-gray-600">{contractor.specialty}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  📍 {contractor.location}
                </p>
                <p className="text-sm text-gray-600">
                  💰 ${contractor.hourlyRate}/hour
                </p>
                <div className="flex items-center">
                  <span className="text-yellow-500">★</span>
                  <span className="ml-1 text-sm">
                    {contractor.rating.toFixed(1)} ({contractor.reviewCount}{" "}
                    reviews)
                  </span>
                </div>
              </div>

              <button
                onClick={() => viewProfile(contractor.id)}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>

        {filteredContractors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No contractors found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
