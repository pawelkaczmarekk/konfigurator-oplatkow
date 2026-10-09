import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Wymagane logowanie' }, { status: 401 });
    }

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('id, canvas_json, shape, created_at, order_id, source, locked, status')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projects = data.map((p: any) => ({
        id: p.id,
        shape: p.shape,
        createdAt: p.created_at,
        orderId: p.order_id,
        source: p.source,
        locked: p.locked,
        status: p.status,
      }));

      return NextResponse.json(projects);
    }

    return NextResponse.json([]);
  } catch (err) {
    console.error('Błąd pobierania projektów:', err);
    return NextResponse.json({ error: 'Błąd pobierania projektów' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvasJson, shape, orderId, source } = body;

    if (!canvasJson && !orderId) {
      return NextResponse.json({ error: 'Brak danych' }, { status: 400 });
    }

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ error: 'Baza niedostępna' }, { status: 503 });
    }

    if (orderId) {
      const { data: existing } = await supabase
        .from('projects')
        .select('id, locked, status')
        .eq('order_id', orderId)
        .single();

      if (existing) {
        return NextResponse.json({ id: existing.id, locked: existing.locked, status: existing.status, exists: true });
      }
    }

    const insertData: any = {
      canvas_json: canvasJson || '{}',
      shape: shape || { type: 'rectangle' },
      source: source || 'oferta',
      status: 'nowy',
    };

    if (orderId) {
      insertData.order_id = orderId;
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('Błąd zapisu projektu:', err);
    return NextResponse.json({ error: 'Błąd zapisu projektu' }, { status: 500 });
  }
}