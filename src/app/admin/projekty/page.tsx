'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase-browser';
import { isAllowedEmail } from '@/lib/auth-config';
import Link from 'next/link';

interface Project {
  id: string;
  shape: any;
  createdAt: string;
  orderId: string | null;
  source: string;
  locked: boolean;
}

function extractId(input: string): string {
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/');
    return parts[parts.length - 1] || input;
  } catch {
    return input.trim();
  }
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isAllowedEmail(session.user.email ?? '')) {
        setUser(session.user);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isAllowedEmail(session.user.email ?? '')) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch('/api/projects', {
        headers: { authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setProjects(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = extractId(search).toLowerCase();
    return projects.filter((p) =>
      p.id.toLowerCase().includes(q) ||
      (p.orderId && p.orderId.toLowerCase().includes(q))
    );
  }, [projects, search]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Brak dostępu</h2>
          <p className="text-gray-500 mb-4">Zaloguj się w panelu administratora.</p>
          <Link href="/admin" className="text-amber-600 hover:underline text-sm">
            Przejdź do panelu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-800">Projekty</h1>
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">Admin</span>
        </div>
        <span className="text-xs text-gray-400">{filtered.length} projektów</span>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po ID, zamówieniu lub linku..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>{search ? 'Nie znaleziono projektów' : 'Brak projektów'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zamówienie</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Źródło</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Link</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Utworzono</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((project) => (
                    <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">{project.id.slice(0, 8)}...</span>
                      </td>
                      <td className="px-4 py-3">
                        {project.orderId ? (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded font-medium">#{project.orderId}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          project.source === 'baselinker'
                            ? 'text-blue-700 bg-blue-50'
                            : 'text-gray-600 bg-gray-100'
                        }`}>
                          {project.source === 'baselinker' ? 'BaseLinker' : 'Oferta'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          project.locked
                            ? 'text-red-700 bg-red-50'
                            : 'text-green-700 bg-green-50'
                        }`}>
                          {project.locked ? 'Zablokowany' : 'Edycja'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`${window.location.origin}/projekt/${project.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-medium"
                        >
                          Otwórz
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleString('pl-PL')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}