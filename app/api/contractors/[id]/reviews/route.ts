import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { ReviewWithDetails } from "@/types/database";

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select(
        `
        id,
        rating,
        title,
        comment,
        created_at,
        profiles!reviews_customer_id_fkey (
          full_name
        )
      `
      )
      .eq("contractor_id", params.id)
      .order("created_at", { ascending: false })
      .returns<ReviewWithDetails[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedReviews =
      reviews?.map((review) => ({
        id: review.id,
        customerName: review.profiles?.full_name || "Anonymous",
        rating: review.rating,
        comment: review.comment || "",
        date: review.created_at,
      })) || [];

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
