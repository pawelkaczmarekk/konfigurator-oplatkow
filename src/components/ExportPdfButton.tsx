'use client';

import { Canvas } from 'fabric';
import { getCanvasDataUrl, exportCanvasToPdf } from '@/lib/pdf-export';

interface ExportPdfButtonProps {
  canvas: Canvas | null;
}

export default function ExportPdfButton({ canvas }: ExportPdfButtonProps) {
  const handleExport = async () => {
    if (!canvas) return;
    try {
      const dataUrl = getCanvasDataUrl(canvas);
      await exportCanvasToPdf(dataUrl);
    } catch (err) {
      console.error('Błąd eksportu PDF:', err);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={!canvas}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-sm"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      Pobierz PDF
    </button>
  );
}