import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getAnonClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

function getAuthClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function GET() {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from('templates')
      .select('id, name, folder, thumbnail, created_at')
      .order('folder', { ascending: true });

    if (error) throw error;

    const templates = (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      folder: t.folder,
      thumbnail: t.thumbnail,
      createdAt: t.created_at,
    }));

    return NextResponse.json(templates);
  } catch (err) {
    console.error('Błąd pobierania szablonów:', err);
    return NextResponse.json({ error: 'Błąd pobierania szablonów' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Wymagane logowanie' }, { status: 401 });
    }

    const anonClient = getAnonClient();
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    const supabase = getAuthClient(token);
    const body = await request.json();
    const { name, folder, canvasJson, shapeConfig, thumbnail } = body;

    if (!name || !folder || !canvasJson) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 });
    }

    const { data, error: dbError } = await supabase
      .from('templates')
      .insert({
        name,
        folder,
        canvas_json: canvasJson,
        shape_config: shapeConfig || {},
        thumbnail: thumbnail || null,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('Błąd zapisywania szablonu:', err);
    return NextResponse.json({ error: 'Błąd zapisywania szablonu' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Wymagane logowanie' }, { status: 401 });
    }

    const anonClient = getAnonClient();
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    const supabase = getAuthClient(token);
    const { id } = await request.json();

    const { error: dbError } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('DB delete error:', dbError);
      return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Błąd usuwania szablonu:', err);
    return NextResponse.json({ error: 'Błąd usuwania szablonu' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Brak id szablonu' }, { status: 400 });
    }

    const supabase = getAnonClient();
    const { data: template, error } = await supabase
      .from('templates')
      .select('canvas_json, shape_config')
      .eq('id', id)
      .single();

    if (error || !template) {
      console.error('Template fetch error:', error);
      return NextResponse.json({ error: 'Szablon nie istnieje' }, { status: 404 });
    }

    return NextResponse.json({
      canvasJson: template.canvas_json,
      shapeConfig: template.shape_config,
    });
  } catch (err) {
    console.error('Błąd pobierania szablonu:', err);
    return NextResponse.json({ error: 'Błąd pobierania szablonu' }, { status: 500 });
  }
}