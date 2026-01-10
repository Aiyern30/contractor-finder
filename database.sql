-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT availability_pkey PRIMARY KEY (id),
  CONSTRAINT availability_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_request_id uuid NOT NULL,
  quote_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  scheduled_date timestamp with time zone NOT NULL,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  completion_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_job_request_id_fkey FOREIGN KEY (job_request_id) REFERENCES public.job_requests(id),
  CONSTRAINT bookings_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id),
  CONSTRAINT bookings_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id),
  CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.contractor_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  bio text,
  years_experience integer,
  license_number text,
  insurance_verified boolean DEFAULT false,
  address text,
  city text,
  state text,
  zip_code text,
  latitude numeric,
  longitude numeric,
  hourly_rate numeric,
  min_project_size numeric,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'suspended'::text, 'rejected'::text])),
  avg_rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_jobs integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contractor_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT contractor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.contractor_projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category_id uuid NOT NULL,
  completion_date date,
  project_value numeric,
  location text,
  images ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contractor_projects_pkey PRIMARY KEY (id),
  CONSTRAINT contractor_projects_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id),
  CONSTRAINT contractor_projects_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id)
);
CREATE TABLE public.contractor_services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  contractor_id uuid NOT NULL,
  category_id uuid NOT NULL,
  price_range_min numeric,
  price_range_max numeric,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contractor_services_pkey PRIMARY KEY (id),
  CONSTRAINT contractor_services_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id),
  CONSTRAINT contractor_services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id)
);
CREATE TABLE public.job_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL,
  category_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  location text,
  budget_min numeric,
  budget_max numeric,
  preferred_date date,
  urgency text CHECK (urgency = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'emergency'::text])),
  status text DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'quoted'::text, 'assigned'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_requests_pkey PRIMARY KEY (id),
  CONSTRAINT job_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id),
  CONSTRAINT job_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_request_id uuid,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_job_request_id_fkey FOREIGN KEY (job_request_id) REFERENCES public.job_requests(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['customer'::text, 'contractor'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.quotes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  job_request_id uuid NOT NULL,
  contractor_id uuid NOT NULL,
  quoted_price numeric NOT NULL,
  estimated_duration text,
  message text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quotes_pkey PRIMARY KEY (id),
  CONSTRAINT quotes_job_request_id_fkey FOREIGN KEY (job_request_id) REFERENCES public.job_requests(id),
  CONSTRAINT quotes_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  booking_id uuid NOT NULL UNIQUE,
  contractor_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  response text,
  response_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT reviews_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractor_profiles(id),
  CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.service_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  icon_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_categories_pkey PRIMARY KEY (id)
);