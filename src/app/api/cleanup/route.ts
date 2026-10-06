import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ error: 'Baza niedostępna' }, { status: 503 });
    }

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .lt('created_at', tenDaysAgo.toISOString())
      .select('id');

    if (error) throw error;

    return NextResponse.json({ deleted: data?.length ?? 0 });
  } catch (err) {
    console.error('Błąd czyszczenia projektów:', err);
    return NextResponse.json({ error: 'Błąd czyszczenia' }, { status: 500 });
  }
}