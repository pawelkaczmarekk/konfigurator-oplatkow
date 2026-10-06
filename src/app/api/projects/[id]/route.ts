import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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