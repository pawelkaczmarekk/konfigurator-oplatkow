'use client';

import { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-browser';
import { isAllowedEmail } from '@/lib/auth-config';

interface Graphic {
  id: string;
  name: string;
  folder: string;
  filename: string;
  src: string;
  createdAt: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [graphics, setGraphics] = useState<Graphic[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [customFolder, setCustomFolder] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!user) return;
    loadGraphics();
  }, [user]);

  const loadGraphics = async () => {
    const res = await fetch('/api/graphics');
    const data = await res.json();
    if (Array.isArray(data)) setGraphics(data);
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin` },
    });
  };

  const handleLogout = async () => {
    await supabase!.auth.signOut();
    setUser(null);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !newName) return;

    const folder = newFolder === '__custom__' ? customFolder : newFolder;
    if (!folder) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', newName);
      formData.append('folder', folder);

      const res = await fetch('/api/graphics', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Błąd wgrywania');

      setNewName('');
      setCustomFolder('');
      if (fileRef.current) fileRef.current.value = '';
      await loadGraphics();
    } catch (err) {
      console.error('Błąd wgrywania:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Usunąć tę grafikę?')) return;

    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/graphics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Błąd usuwania');
      await loadGraphics();
    } catch (err) {
      console.error('Błąd usuwania:', err);
    }
  };

  const folders = [...new Set(graphics.map((g) => g.folder))];

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
          <p className="text-gray-500 mb-4">Twoje konto nie ma uprawnień.</p>
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
          <p className="text-gray-500 mb-6">Zaloguj się, aby zarządzać grafikami.</p>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Panel administratora</h1>
          <p className="text-xs text-gray-500">Zarządzanie grafikami w galerii</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{user.email}</span>
          <button onClick={handleLogout} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700">
            Wyloguj
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Dodaj grafikę</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Nazwa grafiki"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <select
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">Wybierz folder</option>
              {folders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
              <option value="__custom__">Nowy folder...</option>
            </select>
            {newFolder === '__custom__' && (
              <input
                type="text"
                placeholder="Nazwa nowego folderu"
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm file:mr-2 file:text-xs"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !newName || !newFolder || !fileRef.current?.files?.[0]}
            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-40 text-sm font-medium transition-colors"
          >
            {uploading ? 'Wgrywanie...' : 'Wgraj grafikę'}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Wgrane grafiki ({graphics.length})
          </h2>
          {graphics.length === 0 ? (
            <p className="text-sm text-gray-400">Brak grafik</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {graphics.map((g) => (
                <div key={g.id} className="group relative border border-gray-100 rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-50">
                    <img src={g.src} alt={g.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 truncate">{g.name}</p>
                    <p className="text-xs text-gray-400">{g.folder}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}