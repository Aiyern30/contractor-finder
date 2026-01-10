import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { BookingWithDetails } from "@/types/database";

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
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    const { data: bookings, error } = await supabaseAdmin
      .from("bookings")
      .select(
        `
        id,
        scheduled_date,
        status,
        notes,
        created_at,
        contractor_profiles!bookings_contractor_id_fkey (
          id,
          business_name,
          contractor_services (
            service_categories (
              name
            )
          )
        ),
        quotes!bookings_quote_id_fkey (
          quoted_price
        )
      `
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .returns<BookingWithDetails[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedBookings =
      bookings?.map((booking) => {
        const scheduledDate = new Date(booking.scheduled_date);
        return {
          id: booking.id,
          contractorId: booking.contractor_profiles?.id || "",
          contractorName: booking.contractor_profiles?.business_name || "",
          specialty:
            booking.contractor_profiles?.contractor_services?.[0]
              ?.service_categories?.name || "General",
          status: booking.status,
          date: scheduledDate.toISOString().split("T")[0],
          time: scheduledDate.toTimeString().slice(0, 5),
          description: booking.notes || "",
          createdAt: booking.created_at,
          estimatedCost: booking.quotes?.quoted_price || null,
        };
      }) || [];

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { contractorId, customerId, date, time, description, categoryId } =
      await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    // Create job request first
    const { data: jobRequest, error: jobError } = await supabaseAdmin
      .from("job_requests")
      .insert({
        customer_id: customerId,
        category_id: categoryId || "00000000-0000-0000-0000-000000000000",
        title: "Booking Request",
        description: description,
        status: "open",
      })
      .select()
      .single();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    // Create quote
    const scheduledDateTime = new Date(`${date}T${time}`);

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from("quotes")
      .insert({
        job_request_id: jobRequest.id,
        contractor_id: contractorId,
        quoted_price: 0,
        message: "Pending quote",
        status: "pending",
      })
      .select()
      .single();

    if (quoteError) {
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert({
        job_request_id: jobRequest.id,
        quote_id: quote.id,
        contractor_id: contractorId,
        customer_id: customerId,
        scheduled_date: scheduledDateTime.toISOString(),
        status: "scheduled",
        notes: description,
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
