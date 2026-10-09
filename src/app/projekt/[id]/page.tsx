'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Canvas } from 'fabric';
import { User } from '@supabase/supabase-js';
import { A4_WIDTH_PX, A4_HEIGHT_PX, ProjectData } from '@/types';
import { getCanvasDataUrl, exportCanvasToPdf } from '@/lib/pdf-export';
import { applyShapeToCanvas } from '@/lib/canvas-shape';
import { supabase } from '@/lib/supabase-browser';
import { isAllowedEmail } from '@/lib/auth-config';

export default function ProjektPage() {
  const params = useParams();
  const id = params?.id as string;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

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
    if (project.locked && !user) return;

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
  }, [project, user]);

  const handleLogin = async () => {
    setLoggingIn(true);
    const redirectTo = `${window.location.origin}/projekt/${id}`;
    sessionStorage.setItem('auth_redirect', `/projekt/${id}`);
    localStorage.setItem('auth_redirect', `/projekt/${id}`);
    await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    setUser(null);
    setProject(null);
    canvasRef.current = null;
  };

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

  if (project.locked && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Projekt został zapisany</h1>
          <p className="text-gray-500 text-sm">
            Ten projekt został już przesłany do realizacji.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Sprawdzanie uprawnień...</p>
        </div>
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
          <p className="text-gray-500 mb-4">Twoje konto nie ma uprawnień do przeglądania projektów.</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Logowanie wymagane</h2>
          <p className="text-gray-500 mb-6">Aby przeglądać projekty, zaloguj się kontem Google.</p>
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="flex items-center gap-3 mx-auto px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loggingIn ? 'Logowanie...' : 'Zaloguj się przez Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Podgląd projektu</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-gray-500">
              Utworzono: {project?.createdAt ? new Date(project.createdAt).toLocaleString('pl-PL') : ''}
            </p>
            {project?.orderId && (
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                Zamówienie #{project.orderId}
              </span>
            )}
            {project?.source && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                project.source === 'baselinker'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 bg-gray-100'
              }`}>
                {project.source === 'baselinker' ? 'BaseLinker' : 'Oferta'}
              </span>
            )}
            {project?.status && (
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                project.status === 'nowy' ? 'text-gray-700 bg-gray-100' :
                project.status === 'gotowy' ? 'text-green-700 bg-green-50' :
                project.status === 'w_realizacji' ? 'text-blue-700 bg-blue-50' :
                project.status === 'anulowany' ? 'text-red-700 bg-red-50' :
                'text-gray-700 bg-gray-100'
              }`}>
                {project.status === 'nowy' ? 'Nowy' :
                 project.status === 'gotowy' ? 'Gotowy' :
                 project.status === 'w_realizacji' ? 'W realizacji' :
                 project.status === 'anulowany' ? 'Anulowany' :
                 project.status}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{user.email}</span>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Pobierz PDF
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Wyloguj
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div ref={containerRef} className="w-full h-full max-w-3xl max-h-[80vh] flex items-center justify-center" />
      </main>
    </div>
  );
}