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

  return (
    <div className="space-y-2">
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
        <div className="space-y-2">
          <p className="text-xs text-green-700 font-medium">
            Projekt zapisany! Skopiuj link:
          </p>
          <div className="flex gap-1">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded bg-gray-50 text-gray-700 truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? 'Skopiowano!' : 'Kopiuj'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}