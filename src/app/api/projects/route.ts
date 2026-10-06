import { NextRequest, NextResponse } from 'next/server';
import { saveProject } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canvasJson, shape } = body;

    if (!canvasJson || !shape) {
      return NextResponse.json(
        { error: 'Brak wymaganych danych' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .insert({ canvas_json: canvasJson, shape })
        .select('id')
        .single();

      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    const project = saveProject({ canvasJson, shape });
    return NextResponse.json({ id: project.id });
  } catch (err) {
    console.error('Błąd zapisu projektu:', err);
    return NextResponse.json(
      { error: 'Błąd zapisu projektu' },
      { status: 500 }
    );
  }
}