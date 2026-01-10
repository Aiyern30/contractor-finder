export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  user_type: "customer" | "contractor" | "admin";
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  created_at: string;
}

export interface ContractorProfile {
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
  latitude: number | null;
  longitude: number | null;
  hourly_rate: number | null;
  min_project_size: number | null;
  status: "pending" | "approved" | "suspended" | "rejected";
  avg_rating: number;
  total_reviews: number;
  total_jobs: number;
  created_at: string;
  updated_at: string;
}

export interface ContractorService {
  id: string;
  contractor_id: string;
  category_id: string;
  price_range_min: number | null;
  price_range_max: number | null;
  description: string | null;
  created_at: string;
  service_categories: ServiceCategory;
}

export interface Availability {
  id: string;
  contractor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
}

export interface Quote {
  id: string;
  job_request_id: string;
  contractor_id: string;
  quoted_price: number;
  estimated_duration: string | null;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  job_request_id: string;
  quote_id: string;
  contractor_id: string;
  customer_id: string;
  scheduled_date: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  completion_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  contractor_id: string;
  customer_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  response: string | null;
  response_date: string | null;
  created_at: string;
  updated_at: string;
}

// Joined query types
export interface ContractorWithDetails extends ContractorProfile {
  profiles: Profile;
  contractor_services: ContractorService[];
  availability: Availability[];
}

export interface BookingWithDetails extends Booking {
  contractor_profiles: {
    id: string;
    business_name: string;
    contractor_services: {
      service_categories: {
        name: string;
      };
    }[];
  };
  quotes: {
    quoted_price: number;
  };
}

export interface ReviewWithDetails extends Review {
  profiles: {
    full_name: string;
  };
}
