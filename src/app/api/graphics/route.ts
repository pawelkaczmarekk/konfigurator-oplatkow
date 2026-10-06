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
      .from('graphics')
      .select('id, name, folder, filename, created_at')
      .order('folder', { ascending: true });

    if (error) throw error;

    const graphics = (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      folder: g.folder,
      filename: g.filename,
      src: `${supabaseUrl}/storage/v1/object/public/grafiki/${g.folder}/${g.filename}`,
      createdAt: g.created_at,
    }));

    return NextResponse.json(graphics);
  } catch (err) {
    console.error('Błąd pobierania grafik:', err);
    return NextResponse.json({ error: 'Błąd pobierania grafik' }, { status: 500 });
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const folder = formData.get('folder') as string;

    if (!file || !name || !folder) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 });
    }

    const filename = file.name;

    const { error: uploadError } = await supabase.storage
      .from('grafiki')
      .upload(`${folder}/${filename}`, file, { upsert: true });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    const { data, error: dbError } = await supabase
      .from('graphics')
      .insert({ name, folder, filename })
      .select('id')
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      throw dbError;
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('Błąd wgrywania grafiki:', err);
    return NextResponse.json({ error: 'Błąd wgrywania grafiki' }, { status: 500 });
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

    const { data: graphic } = await supabase
      .from('graphics')
      .select('folder, filename')
      .eq('id', id)
      .single();

    if (graphic) {
      const { error: storageError } = await supabase.storage
        .from('grafiki')
        .remove([`${graphic.folder}/${graphic.filename}`]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      const { error: dbError } = await supabase
        .from('graphics')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('DB delete error:', dbError);
        throw dbError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Błąd usuwania grafiki:', err);
    return NextResponse.json({ error: 'Błąd usuwania grafiki' }, { status: 500 });
  }
}