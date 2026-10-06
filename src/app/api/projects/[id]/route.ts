import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Wymagane logowanie' },
        { status: 401 }
      );
    }

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nieprawidłowy token' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('id, canvas_json, shape, created_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return NextResponse.json(
          { error: 'Projekt nie znaleziony' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: data.id,
        canvasJson: data.canvas_json,
        shape: data.shape,
        createdAt: data.created_at,
      });
    }

    const project = getProject(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Projekt nie znaleziony' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (err) {
    console.error('Błąd odczytu projektu:', err);
    return NextResponse.json(
      { error: 'Błąd odczytu projektu' },
      { status: 500 }
    );
  }
}