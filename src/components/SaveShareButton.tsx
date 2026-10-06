'use client';

import { useState } from 'react';
import { Canvas } from 'fabric';
import { ShapeConfig } from '@/types';

interface SaveShareButtonProps {
  canvas: Canvas | null;
  shape: ShapeConfig;
}

export default function SaveShareButton({ canvas, shape }: SaveShareButtonProps) {
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (!canvas) return;
    setSaving(true);
    setShareUrl(null);
    setCopied(false);

    try {
      const json = canvas.toJSON();
      const canvasJson = JSON.stringify(json);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasJson, shape }),
      });

      if (!res.ok) throw new Error('Błąd zapisu');

      const { id } = await res.json();
      const url = `${window.location.origin}/projekt/${id}`;
      setShareUrl(url);
    } catch (err) {
      console.error('Błąd zapisu projektu:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeModal = () => {
    setShareUrl(null);
    setCopied(false);
  };

  return (
    <>
      <button
        onClick={handleSave}
        disabled={!canvas || saving}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {saving ? 'Zapisywanie...' : 'Zapisz i udostępnij'}
      </button>

      {shareUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-[440px] max-w-[92vw] p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">Projekt zapisany!</h3>

            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Podczas zamówienia opłatka dodaj ten link w wiadomości do sprzedawcy.
            </p>

            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-xs px-2 py-1 bg-transparent text-gray-700 outline-none truncate font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-medium transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Skopiowano
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopiuj link
                  </>
                )}
              </button>
            </div>

            <button
              onClick={closeModal}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </>
  );
}