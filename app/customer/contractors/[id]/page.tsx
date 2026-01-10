'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function ContractorProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contractor, setContractor] = useState<ContractorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDescription, setBookingDescription] = useState('');

  useEffect(() => {
    fetchContractorProfile();
    fetchReviews();
  }, [params.id]);

  const fetchContractorProfile = async () => {
    try {
      const response = await fetch(`/api/contractors/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setContractor(data);
      }
    } catch (error) {
      console.error('Error fetching contractor:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/contractors/${params.id}/reviews`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBooking = async () => {
    if (!bookingDate || !bookingTime || !bookingDescription) {
      alert('Please fill in all booking details');
      return;
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractorId: params.id,
          date: bookingDate,
          time: bookingTime,
          description: bookingDescription,
        }),
      });

      if (response.ok) {
        alert('Booking request sent successfully!');
        setShowBookingModal(false);
        router.push('/customer/jobs');
      } else {
        alert('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('An error occurred');
    }
  };

  const startMessage = () => {
    router.push(`/customer/messages?contractor=${params.id}`);
  };

  if (!contractor) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-500 hover:text-blue-600"
        >
          ← Back to Search
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {contractor.name.charAt(0)}
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold">{contractor.name}</h1>
                <p className="text-xl text-gray-600">{contractor.specialty}</p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500 text-xl">★</span>
                  <span className="ml-1 text-lg">{contractor.rating.toFixed(1)} ({contractor.reviewCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">${contractor.hourlyRate}/hr</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">📍 Location: {contractor.location}</p>
              <p className="text-gray-600">📧 Email: {contractor.email}</p>
              <p className="text-gray-600">📞 Phone: {contractor.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">🕐 Availability: {contractor.availability}</p>
              <p className="text-gray-600">💼 Experience: {contractor.experience}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">About</h3>
            <p className="text-gray-700">{contractor.bio}</p>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setShowBookingModal(true)}
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              Book Now
            </button>
            <button
              onClick={startMessage}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              Send Message
            </button>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Reviews ({reviews.length})</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{review.customerName}</p>
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <p className="text-sm text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</p>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-gray-500">No reviews yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Book {contractor.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Description</label>
                <textarea
                  value={bookingDescription}
                  onChange={(e) => setBookingDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the work you need done..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleBooking}
                  className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
