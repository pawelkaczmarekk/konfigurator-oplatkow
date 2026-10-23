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
      .select('id, name, folder, thumbnail, thumbnail_path, tags, created_at')
      .order('folder', { ascending: true });

    if (error) throw error;

    const templates = (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      folder: t.folder,
      thumbnail: t.thumbnail_path
        ? `${supabaseUrl}/storage/v1/object/public/szablony/${t.thumbnail_path}`
        : t.thumbnail || null,
      tags: t.tags || [],
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

    const sanitizePart = (s: string) =>
      s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_/-]/g, '_');
    const safeFolder = sanitizePart(folder);

    const canvasJsonPath = `${safeFolder}/${Date.now()}_canvas.json`;
    const { error: jsonError } = await supabase.storage
      .from('szablony')
      .upload(canvasJsonPath, Buffer.from(canvasJson, 'utf-8'), { contentType: 'application/json', upsert: true });

    if (jsonError) {
      console.error('Canvas JSON upload error:', jsonError);
      return NextResponse.json({ error: `Storage JSON: ${jsonError.message}` }, { status: 500 });
    }

    let thumbnailPath: string | null = null;
    if (thumbnail && thumbnail.startsWith('data:')) {
      const matches = thumbnail.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64 = matches[2];
        const buffer = Buffer.from(base64, 'base64');
        thumbnailPath = `${safeFolder}/${Date.now()}_thumb.${ext}`;

        const { error: thumbError } = await supabase.storage
          .from('szablony')
          .upload(thumbnailPath, buffer, { contentType: `image/${matches[1]}`, upsert: true });

        if (thumbError) {
          console.error('Thumbnail upload error:', thumbError);
          thumbnailPath = null;
        }
      }
    }

    const insertData: any = {
      name,
      folder,
      canvas_json_path: canvasJsonPath,
      shape_config: shapeConfig || {},
    };
    if (thumbnailPath) insertData.thumbnail_path = thumbnailPath;

    const { data, error: dbError } = await supabase
      .from('templates')
      .insert(insertData)
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

    const { data: template } = await supabase
      .from('templates')
      .select('thumbnail_path, canvas_json_path')
      .eq('id', id)
      .single();

    const filesToRemove: string[] = [];
    if (template?.thumbnail_path) filesToRemove.push(template.thumbnail_path);
    if (template?.canvas_json_path) filesToRemove.push(template.canvas_json_path);
    if (filesToRemove.length > 0) {
      await supabase.storage.from('szablony').remove(filesToRemove);
    }

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
        .from('templates')
        .select('id, folder')
        .or(`folder.eq.${renameFolder},folder.like.${renameFolder}/*`);

      if (fetchError) {
        console.error('Folder rename fetch error:', fetchError);
        return NextResponse.json({ error: `DB: ${fetchError.message}` }, { status: 500 });
      }

      for (const item of (items || [])) {
        const newFolder = item.folder === renameFolder
          ? newFolderName
          : newFolderName + item.folder.slice(renameFolder.length);
        await supabase.from('templates').update({ folder: newFolder }).eq('id', item.id);
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
      .from('templates')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('PATCH update error:', error);
      return NextResponse.json({ error: `DB: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Błąd aktualizacji szablonu:', err);
    return NextResponse.json({ error: 'Błąd aktualizacji szablonu' }, { status: 500 });
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
      .select('canvas_json, canvas_json_path, shape_config')
      .eq('id', id)
      .single();

    if (error || !template) {
      console.error('Template fetch error:', error);
      return NextResponse.json({ error: 'Szablon nie istnieje' }, { status: 404 });
    }

    let canvasJson = template.canvas_json;
    if (!canvasJson && template.canvas_json_path) {
      const { data: fileData } = await supabase.storage
        .from('szablony')
        .download(template.canvas_json_path);
      if (fileData) {
        canvasJson = await fileData.text();
      }
    }

    return NextResponse.json({
      canvasJson,
      shapeConfig: template.shape_config,
    });
  } catch (err) {
    console.error('Błąd pobierania szablonu:', err);
    return NextResponse.json({ error: 'Błąd pobierania szablonu' }, { status: 500 });
  }
}