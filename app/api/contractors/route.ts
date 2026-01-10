import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { ContractorWithDetails } from '@/types/database';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET() {
  try {
    const { data: contractors, error } = await supabaseAdmin
      .from('contractor_profiles')
      .select(`
        id,
        business_name,
        bio,
        years_experience,
        city,
        state,
        hourly_rate,
        avg_rating,
        total_reviews,
        profiles!contractor_profiles_user_id_fkey (
          email,
          phone,
          full_name
        ),
        contractor_services (
          service_categories (
            name
          )
        )
      `)
      .eq('status', 'approved')
      .returns<ContractorWithDetails[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formattedContractors = contractors?.map(c => ({
      id: c.id,
      name: c.business_name,
      email: c.profiles?.email || '',
      phone: c.profiles?.phone || '',
      specialty: c.contractor_services?.[0]?.service_categories?.name || 'General',
      location: `${c.city || ''}, ${c.state || ''}`.trim(),
      rating: c.avg_rating || 0,
      reviewCount: c.total_reviews || 0,
      hourlyRate: c.hourly_rate || 0,
    })) || [];

    return NextResponse.json(formattedContractors);
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return NextResponse.json({ error: 'Failed to fetch contractors' }, { status: 500 });
  }
}
