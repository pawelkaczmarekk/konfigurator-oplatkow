'use client';

import { useState } from 'react';
import { Canvas } from 'fabric';
import { ShapeConfig } from '@/types';
import { useRouter } from 'next/navigation';

interface SaveOrderButtonProps {
  canvas: Canvas | null;
  shape: ShapeConfig;
  projectId: string | null;
}

export default function SaveOrderButton({ canvas, shape, projectId }: SaveOrderButtonProps) {
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!canvas || !projectId) return;
    setSaving(true);

    try {
      const json = canvas.toJSON();
      const canvasJson = JSON.stringify(json);

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasJson, shape, locked: true, status: 'gotowy' }),
      });

      if (!res.ok) throw new Error('Błąd zapisu');

      router.push('/dziekujemy');
    } catch (err) {
      console.error('Błąd zapisu projektu:', err);
      setSaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={!canvas || !projectId}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Zapisz projekt
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[92vw] p-6 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">Czy na pewno?</h3>

            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Po zapisaniu projektu nie będzie można go już edytować. Upewnij się, że opłatek jest gotowy.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Jeszcze poprawię
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {saving ? 'Zapisywanie...' : 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}