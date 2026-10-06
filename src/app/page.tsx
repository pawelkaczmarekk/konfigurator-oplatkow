'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Canvas } from 'fabric';
import { ShapeConfig } from '@/types';
import ShapeSelector from '@/components/ShapeSelector';
import ImageUploader from '@/components/ImageUploader';
import PatternGallery from '@/components/PatternGallery';
import TextTool from '@/components/TextTool';
import Toolbar from '@/components/Toolbar';
import SaveShareButton from '@/components/SaveShareButton';
import ObjectDimensions from '@/components/ObjectDimensions';
import CropTool from '@/components/CropTool';
import LayersPanel from '@/components/LayersPanel';
import { useContentProtection } from '@/hooks/useContentProtection';
import { supabase } from '@/lib/supabase-browser';

const FabricCanvas = dynamic(() => import('@/components/FabricCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Ładowanie edytora...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [shape, setShape] = useState<ShapeConfig>({ type: 'rectangle' });
  const [cropMode, setCropMode] = useState<'crop' | 'cut' | null>(null);
  const { isWindowBlurred } = useContentProtection();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const redirectUrl = sessionStorage.getItem('auth_redirect');
        if (redirectUrl) {
          sessionStorage.removeItem('auth_redirect');
          router.replace(redirectUrl);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleCanvasReady = (canvas: Canvas) => {
    setCanvas(canvas);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">
            Konfigurator opłatków
          </h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            A4 (210 × 297 mm, margines 5 mm)
          </span>
        </div>
        <Toolbar canvas={canvas} onCropMode={setCropMode} />
        <ObjectDimensions canvas={canvas} />
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-1 shrink-0">
          <ShapeSelector shape={shape} onChange={setShape} />
          <PatternGallery canvas={canvas} />
          <ImageUploader canvas={canvas} />
          <TextTool canvas={canvas} />
          <div className="border-t border-gray-100 my-2" />
          <div className="space-y-2">
            <SaveShareButton canvas={canvas} shape={shape} />
          </div>
        </aside>

        <main className="flex-1 p-6 flex items-center justify-center overflow-hidden relative" data-protected>
          <div className="w-full h-full max-w-4xl max-h-[90vh]">
            <FabricCanvas onReady={handleCanvasReady} shape={shape} />
          </div>
          {isWindowBlurred && (
            <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-gray-400 text-sm">Treść chroniona</p>
              </div>
            </div>
          )}
        </main>

        <aside className="w-56 bg-white border-l border-gray-200 overflow-hidden shrink-0">
          <LayersPanel canvas={canvas} />
        </aside>
      </div>

      <CropTool canvas={canvas} mode={cropMode} onDone={() => setCropMode(null)} />
    </div>
  );
}