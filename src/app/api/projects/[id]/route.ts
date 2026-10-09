import { NextRequest, NextResponse } from 'next/server';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('id, canvas_json, shape, created_at, order_id, source, locked, status')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: 'Projekt nie znaleziony' }, { status: 404 });
      }

      return NextResponse.json({
        id: data.id,
        canvasJson: data.canvas_json,
        shape: data.shape,
        createdAt: data.created_at,
        orderId: data.order_id,
        source: data.source,
        locked: data.locked,
        status: data.status,
      });
    }

    return NextResponse.json({ error: 'Baza niedostępna' }, { status: 503 });
  } catch (err) {
    console.error('Błąd odczytu projektu:', err);
    return NextResponse.json({ error: 'Błąd odczytu projektu' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    const { id } = await params;
    const body = await request.json();

    if (!isSupabaseConfigured || !supabase) {
      return NextResponse.json({ error: 'Baza niedostępna' }, { status: 503 });
    }

    if (body.lock === true && !token) {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .single();

      if (!project) {
        return NextResponse.json({ error: 'Projekt nie znaleziony' }, { status: 404 });
      }
    }

    const updateData: any = {};
    if (body.canvasJson !== undefined) updateData.canvas_json = body.canvasJson;
    if (body.shape !== undefined) updateData.shape = body.shape;
    if (body.locked !== undefined) updateData.locked = body.locked;
    if (body.status !== undefined) updateData.status = body.status;

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select('id, locked, status')
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id, locked: data.locked, status: data.status });
  } catch (err) {
    console.error('Błąd aktualizacji projektu:', err);
    return NextResponse.json({ error: 'Błąd aktualizacji projektu' }, { status: 500 });
  }
}