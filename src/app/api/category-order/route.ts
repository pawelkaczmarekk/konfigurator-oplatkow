import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const tab = request.nextUrl.searchParams.get('tab');
    if (!tab) {
      return NextResponse.json({ error: 'Brak parametru tab' }, { status: 400 });
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabase
      .from('category_order')
      .select('path, sort_order')
      .eq('tab', tab);

    if (error) throw error;

    const orderMap: Record<string, number> = {};
    for (const row of (data || [])) {
      orderMap[row.path] = row.sort_order;
    }

    return NextResponse.json(orderMap);
  } catch (err) {
    console.error('Błąd pobierania kolejności kategorii:', err);
    return NextResponse.json({ error: 'Błąd pobierania kolejności' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Wymagane logowanie' }, { status: 401 });
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ error: 'Baza niedostępna' }, { status: 503 });
    }

    const { tab, order } = await request.json() as { tab: string; order: { path: string; sort_order: number }[] };

    if (!tab || !order) {
      return NextResponse.json({ error: 'Brak danych' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('category_order')
      .delete()
      .eq('tab', tab);

    if (deleteError) throw deleteError;

    if (order.length > 0) {
      const rows = order.map((o) => ({ tab, path: o.path, sort_order: o.sort_order }));
      const { error: insertError } = await supabase
        .from('category_order')
        .insert(rows);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Błąd zapisu kolejności kategorii:', err);
    return NextResponse.json({ error: 'Błąd zapisu kolejności' }, { status: 500 });
  }
}