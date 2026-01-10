"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { use } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserNav } from "@/components/layout/user-nav";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Clock,
  Briefcase,
  Star,
  DollarSign,
  MessageSquare,
  Calendar,
  Loader2,
} from "lucide-react";

interface ContractorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  location: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  bio: string;
  experience: string;
  availability: string;
}

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export default function ContractorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDescription, setBookingDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractorProfile = async () => {
      try {
        const response = await fetch(`/api/contractors/${resolvedParams.id}`);
        if (response.ok) {
          const data = await response.json();
          setContractor(data);
        }
      } catch (error) {
        console.error("Error fetching contractor:", error);
      }
    };

    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `/api/contractors/${resolvedParams.id}/reviews`
        );
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContractorProfile();
    fetchReviews();
  }, [resolvedParams.id]);

  const handleBooking = async () => {
    if (!bookingDate || !bookingTime || !bookingDescription) {
      alert("Please fill in all booking details");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login to book a contractor");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractorId: resolvedParams.id,
          customerId: user.id,
          date: bookingDate,
          time: bookingTime,
          description: bookingDescription,
        }),
      });

      if (response.ok) {
        alert("Booking request sent successfully!");
        setShowBookingModal(false);
        router.push("/customer/jobs");
      } else {
        const error = await response.json();
        alert(`Failed to create booking: ${error.error}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("An error occurred");
    }
  };

  const startMessage = () => {
    router.push(`/dashboard/customer/messages?contractor=${resolvedParams.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Card className="p-6 bg-white/5 border-white/10">
          <p className="text-white">Contractor not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <UserNav />
        </div>
      </header>

      <div className="container p-6">
        {/* Profile Header */}
        <Card className="p-8 bg-white/5 border-white/10 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
            <div className="w-24 h-24 bg-linear-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shrink-0">
              {contractor.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {contractor.name}
              </h1>
              <p className="text-xl text-purple-400 mb-3">
                {contractor.specialty}
              </p>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(contractor.rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-zinc-600"
                    }`}
                  />
                ))}
                <span className="ml-2 text-white font-semibold">
                  {contractor.rating.toFixed(1)}
                </span>
                <span className="text-zinc-400 ml-1">
                  ({contractor.reviewCount} reviews)
                </span>
              </div>
              <div className="inline-flex items-center px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                <DollarSign className="h-5 w-5 text-green-400 mr-1" />
                <span className="text-2xl font-bold text-green-400">
                  RM {contractor.hourlyRate}
                </span>
                <span className="text-zinc-400 ml-1">/hour</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center text-zinc-300">
                <MapPin className="h-5 w-5 mr-3 text-purple-400" />
                <span>{contractor.location}</span>
              </div>
              <div className="flex items-center text-zinc-300">
                <Mail className="h-5 w-5 mr-3 text-purple-400" />
                <span>{contractor.email}</span>
              </div>
              <div className="flex items-center text-zinc-300">
                <Phone className="h-5 w-5 mr-3 text-purple-400" />
                <span>{contractor.phone}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center text-zinc-300">
                <Clock className="h-5 w-5 mr-3 text-purple-400" />
                <span>{contractor.availability}</span>
              </div>
              <div className="flex items-center text-zinc-300">
                <Briefcase className="h-5 w-5 mr-3 text-purple-400" />
                <span>{contractor.experience} experience</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-3">About</h3>
            <p className="text-zinc-300 leading-relaxed">{contractor.bio}</p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setShowBookingModal(true)}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-12 text-lg font-semibold"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Now
            </Button>
            <Button
              onClick={startMessage}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-12 text-lg font-semibold"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Send Message
            </Button>
          </div>
        </Card>

        {/* Reviews Section */}
        <Card className="p-8 bg-white/5 border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">
            Reviews ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-white">
                    {review.customerName}
                  </p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-zinc-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-zinc-300 mb-2">{review.comment}</p>
                <p className="text-sm text-zinc-500">
                  {new Date(review.date).toLocaleDateString()}
                </p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-center text-zinc-500 py-8">No reviews yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-8 bg-zinc-900 border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">
              Book {contractor.name}
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Date</Label>
                <Input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2 block">Time</Label>
                <Input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2 block">
                  Job Description
                </Label>
                <Textarea
                  value={bookingDescription}
                  onChange={(e) => setBookingDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the work you need done..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleBooking}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-11"
                >
                  Confirm Booking
                </Button>
                <Button
                  onClick={() => setShowBookingModal(false)}
                  variant="outline"
                  className="flex-1 border-white/10 text-white hover:bg-white/5 h-11"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
