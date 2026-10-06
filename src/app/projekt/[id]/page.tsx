'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Canvas, Rect } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX, ProjectData } from '@/types';
import { getCanvasDataUrl, exportCanvasToPdf } from '@/lib/pdf-export';
import { applyShapeToCanvas } from '@/lib/canvas-shape';

export default function ProjektPage() {
  const params = useParams();
  const id = params?.id as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/projects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Nie znaleziono projektu');
        return res.json();
      })
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!project || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = containerWidth / A4_WIDTH_PX;
    const scaleY = containerHeight / A4_HEIGHT_PX;
    const scale = Math.min(scaleX, scaleY);

    const canvasWidth = A4_WIDTH_PX * scale;
    const canvasHeight = A4_HEIGHT_PX * scale;

    const el = document.createElement('canvas');
    el.width = canvasWidth;
    el.height = canvasHeight;
    el.style.border = '1px solid #d1d5db';
    el.style.borderRadius = '4px';
    container.appendChild(el);

    const canvas = new Canvas(el, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      selection: false,
    });

    canvas.setZoom(scale);

    const json = JSON.parse(project.canvasJson);
    canvas.loadFromJSON(json).then(() => {
      applyShapeToCanvas(canvas, project.shape);
      canvas.renderAll();
      canvasRef.current = canvas;
    });

    return () => {
      canvas.dispose();
      if (container.contains(el)) container.removeChild(el);
    };
  }, [project]);

  const handleExportPdf = async () => {
    if (!canvasRef.current) return;
    const dataUrl = getCanvasDataUrl(canvasRef.current);
    await exportCanvasToPdf(dataUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie projektu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Nie znaleziono projektu</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Podgląd projektu</h1>
          <p className="text-xs text-gray-500">
            Utworzono: {project?.createdAt ? new Date(project.createdAt).toLocaleString('pl-PL') : ''}
          </p>
        </div>
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Pobierz PDF
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div ref={containerRef} className="w-full h-full max-w-3xl max-h-[80vh] flex items-center justify-center" />
      </main>
    </div>
  );
}