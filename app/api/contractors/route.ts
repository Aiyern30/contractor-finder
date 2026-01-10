/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const specialty = searchParams.get("specialty");
    const location = searchParams.get("location");
    const maxRate = searchParams.get("maxRate");
    const minRating = searchParams.get("minRating");

    console.log("Fetching contractors with filters:", {
      search,
      specialty,
      location,
      maxRate,
      minRating,
    });

    let query = supabaseAdmin
      .from("contractor_profiles")
      .select(
        `
        id,
        business_name,
        bio,
        years_experience,
        city,
        state,
        hourly_rate,
        avg_rating,
        total_reviews,
        profiles:user_id (
          email,
          phone,
          full_name
        ),
        contractor_services (
          service_categories (
            id,
            name
          )
        )
      `
      );

    // Apply filters
    if (search) {
      query = query.or(`business_name.ilike.%${search}%`);
    }

    if (location) {
      query = query.or(`city.ilike.%${location}%,state.ilike.%${location}%`);
    }

    if (maxRate) {
      query = query.lte("hourly_rate", parseFloat(maxRate));
    }

    if (minRating) {
      query = query.gte("avg_rating", parseFloat(minRating));
    }

    const { data: contractors, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Contractors fetched:", contractors?.length || 0);

    // Filter by specialty on the application side since it's in a related table
    let filteredContractors = contractors || [];

    if (specialty) {
      filteredContractors = filteredContractors.filter((c: any) =>
        c.contractor_services?.some(
          (s: any) => s.service_categories?.name === specialty
        )
      );
    }

    const formattedContractors = filteredContractors.map((c: any) => ({
      id: c.id,
      name: c.business_name,
      email: c.profiles?.email || "",
      phone: c.profiles?.phone || "",
      specialty:
        c.contractor_services?.[0]?.service_categories?.name || "General",
      location: `${c.city || ""}, ${c.state || ""}`.trim(),
      rating: c.avg_rating || 0,
      reviewCount: c.total_reviews || 0,
      hourlyRate: c.hourly_rate || 0,
    }));

    return NextResponse.json(formattedContractors);
  } catch (error) {
    console.error("Error fetching contractors:", error);
    return NextResponse.json(
      { error: "Failed to fetch contractors" },
      { status: 500 }
    );
  }
}
