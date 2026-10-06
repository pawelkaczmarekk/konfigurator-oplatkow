'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, FabricImage } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX, MARGIN_PX, ShapeConfig } from '@/types';
import { supabase } from '@/lib/supabase-browser';
import { applyShapeToCanvas } from '@/lib/canvas-shape';

interface PatternGalleryProps {
  canvas: Canvas | null;
  isAdmin?: boolean;
  shape?: ShapeConfig;
  onShapeChange?: (shape: ShapeConfig) => void;
  externalOpen?: boolean;
  onExternalClose?: () => void;
  hideButton?: boolean;
}

interface PatternItem {
  id: string;
  name: string;
  src: string;
  folder: string;
}

interface TemplateItem {
  id: string;
  name: string;
  folder: string;
  thumbnail: string | null;
  createdAt: string;
}

interface CategoryNode {
  key: string;
  label: string;
  children?: CategoryNode[];
  isFolder?: boolean;
}

const folderLabels: Record<string, string> = {
  'figurki elementy': 'Figurki / Elementy',
  'ramki': 'Ramki',
  'gotowe wzory': 'Gotowe wzory',
};

function buildCategoryTree(folders: string[]): CategoryNode[] {
  const root: CategoryNode[] = [];
  const childMap: Record<string, CategoryNode[]> = {};

  for (const folder of folders) {
    const parts = folder.split(' ');
    const parentKey = parts.length > 1 ? parts.slice(0, -1).join(' ') : null;
    const node: CategoryNode = {
      key: folder,
      label: folderLabels[folder] || folder,
      isFolder: true,
      children: [],
    };

    if (parentKey && childMap[parentKey]) {
      childMap[parentKey].push(node);
    } else {
      root.push(node);
    }
    childMap[folder] = node.children!;
  }

  return root;
}

export default function PatternGallery({ canvas, isAdmin = false, shape, onShapeChange, externalOpen, onExternalClose, hideButton }: PatternGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const effectiveOpen = isOpen || !!externalOpen;

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onExternalClose?.();
  }, [onExternalClose]);

  useEffect(() => {
    if (externalOpen) setIsOpen(true);
  }, [externalOpen]);
  const [activeTab, setActiveTab] = useState<'graphics' | 'templates'>('graphics');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [newFolderInput, setNewFolderInput] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadGraphics = useCallback(() => {
    setLoading(true);
    fetch('/api/graphics')
      .then((res) => res.json())
      .then((data) => {
        setPatterns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadTemplates = useCallback(() => {
    fetch('/api/templates')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadGraphics();
    loadTemplates();
  }, [isOpen, loadGraphics, loadTemplates]);

  const folders = [...new Set(patterns.map((p) => p.folder))];
  const templateFolders = [...new Set(templates.map((t) => t.folder))];
  const categoryTree = buildCategoryTree(activeTab === 'graphics' ? folders : templateFolders);

  const filtered = (activeTab === 'graphics' ? patterns : templates).filter((p) => {
    const matchCat = activeCategory === 'all' || p.folder === activeCategory || p.folder.startsWith(activeCategory + ' ');
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addPattern = useCallback(async (pattern: PatternItem) => {
    if (!canvas) return;
    try {
      const img = await FabricImage.fromURL(pattern.src, { crossOrigin: 'anonymous' });
      const targetSize = Math.min(A4_WIDTH_PX - 2 * MARGIN_PX, A4_HEIGHT_PX - 2 * MARGIN_PX) * 0.6;
      const scale = targetSize / Math.max(img.width || 1, img.height || 1);
      img.set({
        left: A4_WIDTH_PX / 2 - ((img.width || 0) * scale) / 2,
        top: A4_HEIGHT_PX / 2 - ((img.height || 0) * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
      handleClose();
    } catch (err) {
      console.error('Błąd dodawania wzoru:', err);
    }
  }, [canvas]);

  const loadTemplate = useCallback(async (template: TemplateItem) => {
    if (!canvas) return;
    try {
      const res = await fetch(`/api/templates?id=${template.id}`, { method: 'PUT' });
      if (!res.ok) throw new Error('Błąd pobierania szablonu');
      const data = await res.json();

      const json = typeof data.canvasJson === 'string' ? JSON.parse(data.canvasJson) : data.canvasJson;
      await canvas.loadFromJSON(json);

      if (data.shapeConfig && onShapeChange) {
        onShapeChange(data.shapeConfig as ShapeConfig);
      }
      if (data.shapeConfig) {
        applyShapeToCanvas(canvas, data.shapeConfig as ShapeConfig);
      }

      canvas.renderAll();
      handleClose();
    } catch (err) {
      console.error('Błąd ładowania szablonu:', err);
    }
  }, [canvas, onShapeChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      setUploadFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadFiles(files);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    const folder = showNewFolder ? newFolderName.trim() : uploadFolder;
    if (!folder) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;

      for (const file of uploadFiles) {
        const name = file.name.replace(/\.[^/.]+$/, '');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('folder', folder);

        const res = await fetch('/api/graphics', {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
      }

      setUploadFiles([]);
      setUploadFolder('');
      setNewFolderName('');
      setShowNewFolder(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadGraphics();
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
      await fetch('/api/graphics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      loadGraphics();
    } catch (err) {
      console.error('Błąd usuwania:', err);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Usunąć ten szablon?')) return;
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;
      await fetch('/api/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      loadTemplates();
    } catch (err) {
      console.error('Błąd usuwania szablonu:', err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderInput.trim()) return;
    const folderName = newFolderInput.trim();
    try {
      const { data: { session } } = await supabase!.auth.getSession();
      const token = session?.access_token;

      const placeholderFile = new File(['placeholder'], '.gitkeep', { type: 'text/plain' });
      const res = await fetch('/api/graphics', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: (() => {
          const fd = new FormData();
          fd.append('file', placeholderFile);
          fd.append('name', '.gitkeep');
          fd.append('folder', folderName);
          return fd;
        })(),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setNewFolderInput('');
      setShowCreateFolder(false);
      loadGraphics();
    } catch (err) {
      console.error('Błąd tworzenia folderu:', err);
    }
  };

  const handleDeleteFolder = async (folder: string) => {
    if (activeTab === 'graphics') {
      const folderItems = patterns.filter(p => p.folder === folder);
      if (folderItems.length === 0) return;
      if (!confirm(`Usunąć folder "${folder}" i wszystkie jego grafiki (${folderItems.length})?`)) return;
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        const token = session?.access_token;
        for (const item of folderItems) {
          await fetch('/api/graphics', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: item.id }),
          });
        }
        loadGraphics();
      } catch (err) {
        console.error('Błąd usuwania folderu:', err);
      }
    } else {
      const folderItems = templates.filter(t => t.folder === folder);
      if (folderItems.length === 0) return;
      if (!confirm(`Usunąć folder "${folder}" i wszystkie jego szablony (${folderItems.length})?`)) return;
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        const token = session?.access_token;
        for (const item of folderItems) {
          await fetch('/api/templates', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: item.id }),
          });
        }
        loadTemplates();
      } catch (err) {
        console.error('Błąd usuwania folderu:', err);
      }
    }
  };

  const renderCategory = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedCategories.has(node.key);
    const isActive = activeCategory === node.key;

    return (
      <div key={node.key}>
        <div
          className={`w-full flex items-center gap-1 px-4 py-2 text-sm transition-colors ${
            isActive
              ? 'bg-amber-50 text-amber-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          {hasChildren && (
            <button onClick={() => toggleCategory(node.key)} className="shrink-0">
              <svg
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!hasChildren && <span className="w-3 shrink-0" />}
          <button onClick={() => setActiveCategory(node.key)} className="flex-1 text-left">
            {node.label}
          </button>
          {isAdmin && !hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteFolder(node.key); }}
              className="shrink-0 p-0.5 text-gray-300 hover:text-red-500 transition-colors"
              title="Usuń folder"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        {hasChildren && isExpanded && node.children!.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <>
      {!hideButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm font-medium text-gray-700"
        >
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Galeria grafik
        </button>
      )}

      {effectiveOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === overlayRef.current) handleClose();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-[1100px] max-w-[95vw] h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-gray-800">Galeria</h2>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => { setActiveTab('graphics'); setActiveCategory('all'); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === 'graphics'
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Grafiki
                    </button>
                    <button
                      onClick={() => { setActiveTab('templates'); setActiveCategory('all'); }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        activeTab === 'templates'
                          ? 'bg-white text-gray-800 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Szablony
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleClose()}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={activeTab === 'graphics' ? 'Szukaj grafiki...' : 'Szukaj szablonu...'}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <nav className="w-52 border-r border-gray-100 py-2 shrink-0 overflow-y-auto">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    activeCategory === 'all'
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Wszystkie
                </button>
                {isAdmin && activeTab === 'graphics' && !showCreateFolder && (
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="w-full text-left px-4 py-2 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                  >
                    + Nowy folder
                  </button>
                )}
                {isAdmin && activeTab === 'graphics' && showCreateFolder && (
                  <div className="px-3 py-1.5 flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Nazwa folderu"
                      value={newFolderInput}
                      onChange={(e) => setNewFolderInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowCreateFolder(false); setNewFolderInput(''); } }}
                      className="flex-1 min-w-0 px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                      autoFocus
                    />
                    <button onClick={handleCreateFolder} className="p-1 text-green-600 hover:text-green-700 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button onClick={() => { setShowCreateFolder(false); setNewFolderInput(''); }} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {categoryTree.map((cat) => renderCategory(cat))}
              </nav>

              <div className="flex-1 flex flex-col overflow-hidden">
                {isAdmin && activeTab === 'graphics' && (
                  <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                    {uploadFiles.length === 0 ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                          dragOver
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                        }`}
                      >
                        <svg className="mx-auto w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-500">
                          Przeciągnij grafiki lub <span className="text-amber-600 font-medium">wybierz z komputera</span>
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {uploadFiles.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {f.name}
                            </span>
                          ))}
                          <button
                            onClick={() => { setUploadFiles([]); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="text-xs text-gray-400 hover:text-red-500"
                          >
                            Wyczyść
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {!showNewFolder ? (
                            <div className="flex items-center gap-2 flex-1">
                              <select
                                value={uploadFolder}
                                onChange={(e) => setUploadFolder(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                <option value="">Wybierz folder</option>
                                {folders.map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => setShowNewFolder(true)}
                                className="px-3 py-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap"
                              >
                                + Nowy folder
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                placeholder="Nazwa nowego folderu"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                autoFocus
                              />
                              <button
                                onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
                                className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                              >
                                Anuluj
                              </button>
                            </div>
                          )}
                          <button
                            onClick={handleUpload}
                            disabled={uploading || (!showNewFolder ? !uploadFolder : !newFolderName.trim())}
                            className="px-4 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-40 text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            {uploading ? 'Wgrywanie...' : 'Wgraj'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 p-4 overflow-y-auto">
                  {loading && activeTab === 'graphics' ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">{activeTab === 'graphics' ? 'Brak grafik' : 'Brak szablonów'}</p>
                    </div>
                  ) : activeTab === 'graphics' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {filtered.map((pattern) => (
                        <div
                          key={pattern.id}
                          className="group relative flex flex-col items-center gap-2 p-2 sm:p-3 rounded-xl border-2 border-gray-100 bg-white hover:border-amber-400 hover:bg-amber-50 transition-all hover:shadow-md active:bg-amber-50"
                        >
                          <button onClick={() => addPattern(pattern as PatternItem)} className="w-full">
                            <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                              <img src={(pattern as PatternItem).src} alt={pattern.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>
                          </button>
                          <span className="text-xs text-gray-600 group-hover:text-amber-700 font-medium">{pattern.name}</span>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(pattern.id); }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Usuń grafikę"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {filtered.map((template) => (
                        <div
                          key={template.id}
                          className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-100 bg-white hover:border-purple-400 hover:bg-purple-50 transition-all hover:shadow-md"
                        >
                          <button onClick={() => loadTemplate(template as TemplateItem)} className="w-full">
                            <div className="w-full aspect-[210/297] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                              {(template as TemplateItem).thumbnail ? (
                                <img src={(template as TemplateItem).thumbnail!} alt={template.name} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                              )}
                            </div>
                          </button>
                          <span className="text-xs text-gray-600 group-hover:text-purple-700 font-medium">{template.name}</span>
                          {isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Usuń szablon"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}