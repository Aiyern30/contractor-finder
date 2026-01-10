import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { ContractorWithDetails } from '@/types/database';

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: contractor, error } = await supabaseAdmin
      .from('contractor_profiles')
      .select(`
        id,
        business_name,
        bio,
        years_experience,
        license_number,
        address,
        city,
        state,
        zip_code,
        hourly_rate,
        avg_rating,
        total_reviews,
        total_jobs,
        profiles!contractor_profiles_user_id_fkey (
          email,
          phone,
          full_name
        ),
        contractor_services (
          service_categories (
            name
          )
        ),
        availability (
          day_of_week,
          start_time,
          end_time
        )
      `)
      .eq('id', params.id)
      .single<ContractorWithDetails>();

    if (error || !contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    const formattedContractor = {
      id: contractor.id,
      name: contractor.business_name,
      email: contractor.profiles?.email || '',
      phone: contractor.profiles?.phone || '',
      specialty: contractor.contractor_services?.[0]?.service_categories?.name || 'General',
      location: `${contractor.city || ''}, ${contractor.state || ''}`.trim(),
      rating: contractor.avg_rating || 0,
      reviewCount: contractor.total_reviews || 0,
      hourlyRate: contractor.hourly_rate || 0,
      bio: contractor.bio || '',
      experience: `${contractor.years_experience || 0} years`,
      availability: contractor.availability?.length > 0 ? 'Available' : 'Contact for availability',
    };

    return NextResponse.json(formattedContractor);
  } catch (error) {
    console.error('Error fetching contractor:', error);
    return NextResponse.json({ error: 'Failed to fetch contractor' }, { status: 500 });
  }
}
