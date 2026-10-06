'use client';

import { useState, useEffect } from 'react';
import { Canvas } from 'fabric';
import { ShapeConfig } from '@/types';
import { supabase } from '@/lib/supabase-browser';

interface SaveTemplateButtonProps {
  canvas: Canvas | null;
  shape: ShapeConfig;
}

export default function SaveTemplateButton({ canvas, shape }: SaveTemplateButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [saved, setSaved] = useState(false);
  const [existingFolders, setExistingFolders] = useState<string[]>([]);

  useEffect(() => {
    if (!showModal) return;
    Promise.all([
      fetch('/api/graphics').then(r => r.json()),
      fetch('/api/templates').then(r => r.json()),
    ]).then(([graphics, templates]) => {
      const gfxFolders = Array.isArray(graphics) ? graphics.map((g: any) => g.folder) : [];
      const tplFolders = Array.isArray(templates) ? templates.map((t: any) => t.folder) : [];
      setExistingFolders([...new Set([...gfxFolders, ...tplFolders])]);
    }).catch(() => {});
  }, [showModal]);

  const handleSave = async () => {
    if (!canvas) return;
    const finalFolder = showNewFolder ? newFolder.trim() : folder;
    if (!name.trim() || !finalFolder) return;

    setSaving(true);
    try {
      const json = canvas.toJSON();
      const canvasJson = JSON.stringify(json);

      let thumbnail: string | null = null;
      try {
        const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 0.3 });
        thumbnail = dataUrl;
      } catch {}

      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          folder: finalFolder,
          canvasJson,
          shapeConfig: shape,
          thumbnail,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowModal(false);
        setName('');
        setFolder('');
        setNewFolder('');
        setShowNewFolder(false);
      }, 1500);
    } catch (err) {
      console.error('Błąd zapisu szablonu:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={!canvas}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        Zapisz jako szablon
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[95vw] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Zapisz jako szablon</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nazwa szablonu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                autoFocus
              />

              {!showNewFolder ? (
                <div className="flex gap-2">
                  <select
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">Wybierz folder</option>
                    {existingFolders.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowNewFolder(true)}
                    className="px-3 py-2 text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap"
                  >
                    + Nowy folder
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nazwa nowego folderu"
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    autoFocus
                  />
                  <button
                    onClick={() => { setShowNewFolder(false); setNewFolder(''); }}
                    className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Anuluj
                  </button>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !name.trim() || (!showNewFolder ? !folder : !newFolder.trim())}
                className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 text-sm font-medium transition-colors"
              >
                {saving ? 'Zapisywanie...' : saved ? 'Zapisano!' : 'Zapisz szablon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}