import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryIds = searchParams.get('categoryIds')?.split(',') || [];
  const quotedJobIds = searchParams.get('quotedJobIds')?.split(',') || [];
  
  let query = supabaseAdmin
    .from('job_requests')
    .select(`
      id, title, description, location, budget_min, budget_max,
      preferred_date, urgency, status, created_at, category_id,
      service_categories!job_requests_category_id_fkey (name),
      profiles!job_requests_customer_id_fkey (full_name)
    `)
    .eq('status', 'open')
    .in('category_id', categoryIds);

  if (quotedJobIds.length > 0 && quotedJobIds[0]) {
    query = query.not('id', 'in', `(${quotedJobIds.join(',')})`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
