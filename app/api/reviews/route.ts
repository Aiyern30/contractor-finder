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

export async function POST(request: Request) {
  try {
    const { bookingId, contractorId, customerId, rating, title, comment } =
      await request.json();

    if (!contractorId || !customerId || !rating) {
      return NextResponse.json(
        { error: "Contractor ID, Customer ID, and Rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if customer profile exists
    const { data: customerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", customerId)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      throw profileError;
    }

    // If profile doesn't exist, user needs to complete registration
    if (!customerProfile) {
      console.error("Customer profile not found for user:", customerId);
      return NextResponse.json(
        {
          error: "Profile not found. Please complete your profile setup first.",
        },
        { status: 404 }
      );
    }

    // If bookingId is provided, verify it exists and belongs to customer
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from("bookings")
        .select("id, customer_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingError || !booking) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 }
        );
      }

      if (booking.customer_id !== customerId) {
        return NextResponse.json(
          { error: "Unauthorized: This booking doesn't belong to you" },
          { status: 403 }
        );
      }

      // Check if review already exists for this booking
      const { data: existingReview } = await supabaseAdmin
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this booking" },
          { status: 400 }
        );
      }
    }

    // Create the review
    const reviewData: any = {
      contractor_id: contractorId,
      customer_id: customerId,
      rating,
      title: title?.trim() || null,
      comment: comment?.trim() || null,
    };

    if (bookingId) {
      reviewData.booking_id = bookingId;
    }

    const { data: review, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .insert(reviewData)
      .select()
      .single();

    if (reviewError) {
      console.error("Review insert error:", reviewError);
      if (reviewError.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this" },
          { status: 400 }
        );
      }
      if (reviewError.code === "23503") {
        return NextResponse.json(
          { error: "Invalid booking or contractor ID" },
          { status: 400 }
        );
      }
      throw reviewError;
    }

    // Update contractor's average rating and total reviews
    const { data: reviews } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("contractor_id", contractorId);

    if (reviews && reviews.length > 0) {
      const avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await supabaseAdmin
        .from("contractor_profiles")
        .update({
          avg_rating: avgRating,
          total_reviews: reviews.length,
        })
        .eq("id", contractorId);
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
