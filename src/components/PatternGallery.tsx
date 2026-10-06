'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, FabricImage } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX, MARGIN_PX } from '@/types';

interface PatternGalleryProps {
  canvas: Canvas | null;
}

interface PatternItem {
  id: string;
  name: string;
  src: string;
  category: string;
}

interface CategoryNode {
  key: string;
  label: string;
  children?: CategoryNode[];
  isFolder?: boolean;
}

const categoryTree: CategoryNode[] = [
  {
    key: 'gotowe-wzory',
    label: 'Gotowe wzory',
    isFolder: true,
    children: [],
  },
  {
    key: 'ramki',
    label: 'Ramki',
    isFolder: true,
    children: [],
  },
  {
    key: 'figurki-elementy',
    label: 'Figurki / Elementy',
    isFolder: true,
    children: [
      { key: 'figurki-elementy-psi-patrol', label: 'Psi Patrol' },
      { key: 'figurki-elementy-swiateczne', label: 'Świąteczne' },
      { key: 'figurki-elementy-inne', label: 'Inne' },
    ],
  },
];

function flattenCategories(nodes: CategoryNode[], prefix = ''): { key: string; label: string; depth: number }[] {
  const result: { key: string; label: string; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ key: node.key, label: node.label, depth: prefix.split('/').length - 1 });
    if (node.children) {
      result.push(...flattenCategories(node.children, prefix + node.key + '/'));
    }
  }
  return result;
}

const allCategories = flattenCategories(categoryTree);

const patterns: PatternItem[] = [
  { id: 'figurka1', name: 'Opłatek 1', src: '/grafiki/figurki elementy/oplatek1.jpg', category: 'figurki-elementy' },
  { id: 'figurka2', name: 'Opłatek 2', src: '/grafiki/figurki elementy/oplatek2.jpg', category: 'figurki-elementy' },
  { id: 'figurka3', name: 'Opłatek 3', src: '/grafiki/figurki elementy/oplatek 3.png', category: 'figurki-elementy-psi-patrol' },
  { id: 'ramka1', name: 'Ramka 1', src: '/grafiki/ramki/il_570xN.4625700682_civt.webp', category: 'ramki' },
];

export default function PatternGallery({ canvas }: PatternGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['figurki-elementy']));
  const [search, setSearch] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  const filtered = patterns.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory || p.category.startsWith(activeCategory + '-');
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const addPattern = useCallback(async (pattern: PatternItem) => {
    if (!canvas) {
      console.error('Canvas nie jest gotowy');
      return;
    }

    try {
      const img = await FabricImage.fromURL(pattern.src);

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
      setIsOpen(false);
    } catch (err) {
      console.error('Błąd dodawania wzoru:', err);
    }
  }, [canvas]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderCategory = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedCategories.has(node.key);
    const isActive = activeCategory === node.key;

    return (
      <div key={node.key}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleCategory(node.key);
            }
            setActiveCategory(node.key);
          }}
          className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-1 ${
            isActive
              ? 'bg-amber-50 text-amber-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          {hasChildren && (
            <svg
              className={`w-3 h-3 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {!hasChildren && <span className="w-3" />}
          {node.label}
        </button>
        {hasChildren && isExpanded && node.children!.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm font-medium text-gray-700"
      >
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Galeria grafik
      </button>

      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === overlayRef.current) setIsOpen(false);
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-[1100px] max-w-[95vw] h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-800">Galeria grafik</h2>
                <button
                  onClick={() => setIsOpen(false)}
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
                  placeholder="Szukaj grafiki..."
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
                {categoryTree.map((cat) => renderCategory(cat))}
              </nav>

              <div className="flex-1 p-4 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">Brak grafik</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {filtered.map((pattern) => (
                      <button
                        key={pattern.id}
                        onClick={() => addPattern(pattern)}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-100 bg-white hover:border-amber-400 hover:bg-amber-50 transition-all hover:shadow-md"
                      >
                        <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={pattern.src}
                            alt={pattern.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-600 group-hover:text-amber-700 font-medium">
                          {pattern.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}