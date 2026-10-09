'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Canvas } from 'fabric';
import { ShapeConfig } from '@/types';
import ShapeSelector from '@/components/ShapeSelector';
import ImageUploader from '@/components/ImageUploader';
import PatternGallery from '@/components/PatternGallery';
import TextTool from '@/components/TextTool';
import Toolbar from '@/components/Toolbar';
import SaveShareButton from '@/components/SaveShareButton';
import SaveOrderButton from '@/components/SaveOrderButton';
import ObjectDimensions from '@/components/ObjectDimensions';
import CropTool from '@/components/CropTool';
import LayersPanel from '@/components/LayersPanel';
import BottomSheet from '@/components/BottomSheet';
import MobileBottomBar from '@/components/MobileBottomBar';
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

type MobileTool = 'shape' | 'gallery' | 'upload' | 'text' | 'layers' | null;

export default function HomeWrapper() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Ładowanie edytora...</p>
        </div>
      </div>
    }>
      <Home />
    </Suspense>
  );
}

function Home() {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [shape, setShape] = useState<ShapeConfig>({ type: 'rectangle' });
  const [cropMode, setCropMode] = useState<'crop' | 'cut' | null>(null);
  const [mobileTool, setMobileTool] = useState<MobileTool>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  useContentProtection();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const order = searchParams.get('order');
    if (order) {
      setOrderId(order);
    } else {
      setProjectLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!orderId) return;

    const initOrderProject = async () => {
      try {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canvasJson: '{}', shape: { type: 'rectangle' }, orderId, source: 'baselinker' }),
        });

        if (!res.ok) throw new Error('Błąd tworzenia projektu');

        const data = await res.json();

        if (data.locked) {
          router.replace('/dziekujemy');
          return;
        }

        setProjectId(data.id);
      } catch (err) {
        console.error('Błąd inicjalizacji projektu:', err);
      } finally {
        setProjectLoading(false);
      }
    };

    initOrderProject();
  }, [orderId, router]);

  useEffect(() => {
    const checkRedirect = async () => {
      const redirectUrl = localStorage.getItem('auth_redirect');
      if (redirectUrl && window.location.hash) {
        const { data: { session } } = await supabase!.auth.getSession();
        if (session) {
          localStorage.removeItem('auth_redirect');
          window.location.href = redirectUrl;
        }
      }
    };
    checkRedirect();

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        const redirectUrl = localStorage.getItem('auth_redirect');
        if (redirectUrl) {
          localStorage.removeItem('auth_redirect');
          window.location.href = redirectUrl;
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleCanvasReady = (canvas: Canvas) => {
    setCanvas(canvas);
  };

  const handleMobileToolSelect = (tool: MobileTool) => {
    setMobileTool(tool);
  };

  const isOrderMode = !!orderId;

  if (projectLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Przygotowywanie edytora...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="hidden md:flex bg-white border-b border-gray-200 px-4 py-2.5 items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">
            Konfigurator opłatków
          </h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            A4 (210 × 297 mm, margines 5 mm)
          </span>
          {isOrderMode && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
              Zamówienie #{orderId}
            </span>
          )}
        </div>
        <Toolbar canvas={canvas} onCropMode={setCropMode} />
        <ObjectDimensions canvas={canvas} />
      </header>

      <header className="md:hidden bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between shrink-0">
        <h1 className="text-sm font-bold text-gray-800">Konfigurator opłatków</h1>
        {isOrderMode ? (
          <SaveOrderButton canvas={canvas} shape={shape} projectId={projectId} />
        ) : (
          <SaveShareButton canvas={canvas} shape={shape} />
        )}
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="hidden md:block w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-1 shrink-0">
          <ShapeSelector shape={shape} onChange={setShape} />
          <PatternGallery canvas={canvas} isAdmin={false} shape={shape} onShapeChange={setShape} />
          <ImageUploader canvas={canvas} />
          <TextTool canvas={canvas} />
          <div className="border-t border-gray-100 my-2" />
          <div className="space-y-2">
            {isOrderMode ? (
              <SaveOrderButton canvas={canvas} shape={shape} projectId={projectId} />
            ) : (
              <SaveShareButton canvas={canvas} shape={shape} />
            )}
          </div>
        </aside>

        <main className="flex-1 p-2 md:p-6 flex items-center justify-center overflow-auto relative" data-protected>
          <div className="w-full h-full max-w-4xl max-h-[90vh]">
            <FabricCanvas onReady={handleCanvasReady} shape={shape} />
          </div>

          <div className="md:hidden absolute top-2 right-2">
            <ObjectDimensions canvas={canvas} />
          </div>
        </main>

        <aside className="hidden md:block w-56 bg-white border-l border-gray-200 overflow-hidden shrink-0">
          <LayersPanel canvas={canvas} />
        </aside>

        <MobileBottomBar
          canvas={canvas}
          activeTool={mobileTool}
          onToolSelect={handleMobileToolSelect}
          onCropMode={setCropMode}
        />
      </div>

      <BottomSheet isOpen={mobileTool === 'shape'} onClose={() => setMobileTool(null)} title="Kształt opłatka">
        <ShapeSelector shape={shape} onChange={setShape} />
      </BottomSheet>

      <BottomSheet isOpen={mobileTool === 'upload'} onClose={() => setMobileTool(null)} title="Twoja grafika">
        <ImageUploader canvas={canvas} />
      </BottomSheet>

      <BottomSheet isOpen={mobileTool === 'text'} onClose={() => setMobileTool(null)} title="Tekst">
        <TextTool canvas={canvas} />
      </BottomSheet>

      <BottomSheet isOpen={mobileTool === 'layers'} onClose={() => setMobileTool(null)} title="Warstwy">
        <div className="h-[40vh]">
          <LayersPanel canvas={canvas} />
        </div>
      </BottomSheet>

      <div className="md:hidden">
        <PatternGallery
          canvas={canvas}
          isAdmin={false}
          shape={shape}
          onShapeChange={setShape}
          externalOpen={mobileTool === 'gallery'}
          onExternalClose={() => setMobileTool(null)}
          hideButton
        />
      </div>

      <CropTool canvas={canvas} mode={cropMode} onDone={() => setCropMode(null)} />
    </div>
  );
}