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
      .select('id, name, folder, filename, tags, created_at')
      .order('folder', { ascending: true });

    if (error) throw error;

    const graphics = (data || []).map((g: any) => ({
      id: g.id,
      name: g.name,
      folder: g.folder,
      filename: g.filename,
      tags: g.tags || [],
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
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    console.log('Upload graphics - user:', user.email);

    const supabase = getAuthClient(token);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const sanitizePart = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_/-]/g, '_');

    const folder = sanitizePart(formData.get('folder') as string);
    const tagsRaw = formData.get('tags') as string | null;

    if (!file || !name || !folder) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 });
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const sanitizeFilename = (name: string) => {
      const ext = name.lastIndexOf('.');
      const base = ext >= 0 ? name.slice(0, ext) : name;
      const extPart = ext >= 0 ? name.slice(ext) : '';
      const sanitized = base
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      return sanitized + extPart;
    };

    const filename = sanitizeFilename(file.name);
    const storagePath = `${folder}/${filename}`;

    console.log('Upload graphics - path:', storagePath, 'size:', file.size);

    const { error: uploadError } = await supabase.storage
      .from('grafiki')
      .upload(storagePath, file, { upsert: true });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: `Storage: ${uploadError.message}` }, { status: 500 });
    }

    const { data, error: dbError } = await supabase
      .from('graphics')
      .insert({ name, folder, filename, tags })
      .select('id')
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json({ error: `DB: ${dbError.message}` }, { status: 500 });
    }

    console.log('Upload graphics - success, id:', data.id);

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error('Błąd wgrywania grafiki:', err);
    return NextResponse.json({ error: 'Błąd wgrywania grafiki' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const { id, name, folder, tags, renameFolder, newFolderName } = await request.json();

    if (renameFolder && newFolderName) {
      const { data: items, error: fetchError } = await supabase
        .from('graphics')
        .select('id, folder, filename')
        .or(`folder.eq.${renameFolder},folder.like.${renameFolder}/*`);

      if (fetchError) {
        console.error('Folder rename fetch error:', fetchError);
        return NextResponse.json({ error: `DB: ${fetchError.message}` }, { status: 500 });
      }

      for (const item of (items || [])) {
        const newFolder = item.folder === renameFolder
          ? newFolderName
          : newFolderName + item.folder.slice(renameFolder.length);
        const oldPath = `${item.folder}/${item.filename}`;
        const newPath = `${newFolder}/${item.filename}`;
        await supabase.storage.from('grafiki').move(oldPath, newPath);
        await supabase.from('graphics').update({ folder: newFolder }).eq('id', item.id);
      }

      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ error: 'Brak ID' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (folder !== undefined) updateData.folder = folder;
    if (tags !== undefined) updateData.tags = tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean);

    const { error } = await supabase
      .from('graphics')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('PATCH update error:', error);
      return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Błąd aktualizacji grafiki:', err);
    return NextResponse.json({ error: 'Błąd aktualizacji grafiki' }, { status: 500 });
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