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
import { isAllowedEmail } from '@/lib/auth-config';
import ExportPdfButton from '@/components/ExportPdfButton';
import SaveTemplateButton from '@/components/SaveTemplateButton';

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

export default function AdminPage() {
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [shape, setShape] = useState<ShapeConfig>({ type: 'rectangle' });
  const [cropMode, setCropMode] = useState<'crop' | 'cut' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const { isWindowBlurred } = useContentProtection();
  const router = useRouter();

  useEffect(() => {
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (isAllowedEmail(session.user.email ?? '')) {
          setUser(session.user);
        } else {
          setAccessDenied(true);
        }
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        if (isAllowedEmail(session.user.email ?? '')) {
          setUser(session.user);
          setAccessDenied(false);
        } else {
          setAccessDenied(true);
          setUser(null);
        }
      } else {
        setUser(null);
        setAccessDenied(false);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    });
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <svg className="mx-auto h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Brak dostępu</h2>
          <p className="text-gray-500 mb-4">Twoje konto nie ma uprawnień do panelu administratora.</p>
          <button onClick={handleLogout} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
            Wyloguj się
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <svg className="mx-auto h-16 w-16 text-amber-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Panel administratora</h2>
          <p className="text-gray-500 mb-6">Zaloguj się, aby uzyskać dostęp.</p>
          <button
            onClick={handleLogin}
            className="flex items-center gap-3 mx-auto px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all text-sm font-medium text-gray-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Zaloguj się przez Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-800">
            Konfigurator opłatków
          </h1>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
            Admin
          </span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            A4 (210 × 297 mm, margines 5 mm)
          </span>
        </div>
        <Toolbar canvas={canvas} onCropMode={setCropMode} />
        <div className="flex items-center gap-3">
          <ObjectDimensions canvas={canvas} />
          <span className="text-xs text-gray-400">{user.email}</span>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
            Wyloguj
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto p-4 space-y-1 shrink-0">
          <ShapeSelector shape={shape} onChange={setShape} />
          <PatternGallery canvas={canvas} isAdmin={true} shape={shape} onShapeChange={setShape} />
          <ImageUploader canvas={canvas} />
          <TextTool canvas={canvas} />
          <div className="border-t border-gray-100 my-2" />
          <div className="space-y-2">
            <SaveTemplateButton canvas={canvas} shape={shape} />
            <ExportPdfButton canvas={canvas} />
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

  function handleCanvasReady(c: Canvas) {
    setCanvas(c);
  }
}