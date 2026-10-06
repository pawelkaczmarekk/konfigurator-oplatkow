'use client';

import { useState, useEffect, useCallback } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { SYSTEM_OBJECTS } from '@/lib/canvas-shape';

interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  thumbnail: string;
}

interface LayersPanelProps {
  canvas: Canvas | null;
}

function getObjectLabel(obj: FabricObject, index: number): string {
  const name = (obj as any).name;
  if (name && !name.startsWith('__')) return name;
  switch (obj.type) {
    case 'i-text':
    case 'text':
    case 'textbox':
      const text = (obj as any).text;
      return text ? `Tekst: ${text.slice(0, 15)}` : `Tekst ${index + 1}`;
    case 'image':
      return `Obraz ${index + 1}`;
    case 'group':
      return `Grupa ${index + 1}`;
    case 'rect':
      return `Prostokąt ${index + 1}`;
    case 'circle':
      return `Okrąg ${index + 1}`;
    case 'ellipse':
      return `Elipsa ${index + 1}`;
    case 'path':
      return `Ścieżka ${index + 1}`;
    case 'polygon':
      return `Wielokąt ${index + 1}`;
    case 'line':
      return `Linia ${index + 1}`;
    default:
      return `Obiekt ${index + 1}`;
  }
}

function generateThumbnail(obj: FabricObject): string {
  try {
    const el = (obj as any)._element;
    if (el && el.tagName === 'IMG') {
      return el.src;
    }
  } catch {}
  return '';
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'i-text':
    case 'text':
    case 'textbox':
      return 'T';
    case 'image':
      return '🖼';
    case 'group':
      return '📁';
    case 'rect':
      return '▬';
    case 'circle':
    case 'ellipse':
      return '●';
    case 'path':
      return '✎';
    default:
      return '◇';
  }
}

export default function LayersPanel({ canvas }: LayersPanelProps) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refreshLayers = useCallback(() => {
    if (!canvas) return;
    const allObjects = canvas.getObjects();
    const userObjects = allObjects.filter(
      (obj) => !SYSTEM_OBJECTS.has((obj as any).name)
    );

    const newLayers: LayerItem[] = userObjects.map((obj, i) => ({
      id: (obj as any).__layerId || `layer_${Date.now()}_${i}`,
      name: getObjectLabel(obj, i),
      type: obj.type || 'unknown',
      visible: obj.visible !== false,
      locked: (obj as any).selectable === false,
      thumbnail: generateThumbnail(obj),
    }));

    userObjects.forEach((obj, i) => {
      if (!(obj as any).__layerId) {
        (obj as any).__layerId = newLayers[i].id;
      }
    });

    setLayers(newLayers);

    const active = canvas.getActiveObject();
    if (active && !SYSTEM_OBJECTS.has((active as any).name)) {
      setSelectedId((active as any).__layerId || null);
    } else {
      setSelectedId(null);
    }
  }, [canvas]);

  useEffect(() => {
    if (!canvas) return;

    refreshLayers();

    const onSelectionChange = () => {
      const active = canvas.getActiveObject();
      if (active && !SYSTEM_OBJECTS.has((active as any).name)) {
        setSelectedId((active as any).__layerId || null);
      } else {
        setSelectedId(null);
      }
    };

    const onCanvasChange = () => {
      refreshLayers();
    };

    const events = [
      'object:added',
      'object:removed',
      'object:modified',
      'selection:created',
      'selection:updated',
      'selection:cleared',
    ];

    events.forEach((event) => {
      if (event.startsWith('selection')) {
        canvas.on(event as any, onSelectionChange);
      } else {
        canvas.on(event as any, onCanvasChange);
      }
    });

    return () => {
      events.forEach((event) => {
        if (event.startsWith('selection')) {
          canvas.off(event as any, onSelectionChange);
        } else {
          canvas.off(event as any, onCanvasChange);
        }
      });
    };
  }, [canvas, refreshLayers]);

  const selectLayer = (id: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).__layerId === id);
    if (obj) {
      canvas.setActiveObject(obj);
      canvas.renderAll();
    }
  };

  const toggleVisibility = (id: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).__layerId === id);
    if (obj) {
      obj.set('visible', !obj.visible);
      canvas.renderAll();
      refreshLayers();
    }
  };

  const toggleLock = (id: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).__layerId === id);
    if (obj) {
      const locked = (obj as any).selectable === false;
      obj.set({
        selectable: locked,
        evented: locked,
      } as any);
      canvas.renderAll();
      refreshLayers();
    }
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    if (!canvas) return;
    const allObjects = canvas.getObjects();
    const userObjects = allObjects.filter((o) => !SYSTEM_OBJECTS.has((o as any).name));
    const userIdx = userObjects.findIndex((o) => (o as any).__layerId === id);
    if (userIdx === -1) return;

    const swapIdx = direction === 'up' ? userIdx + 1 : userIdx - 1;
    if (swapIdx < 0 || swapIdx >= userObjects.length) return;

    const obj = userObjects[userIdx];
    const swapObj = userObjects[swapIdx];

    canvas.remove(obj);
    canvas.remove(swapObj);

    if (direction === 'up') {
      canvas.add(swapObj);
      canvas.add(obj);
    } else {
      canvas.add(obj);
      canvas.add(swapObj);
    }

    const bg = allObjects.find((o) => (o as any).name === '__a4_background__');
    if (bg) canvas.sendObjectToBack(bg);

    canvas.renderAll();
    refreshLayers();
  };

  const deleteLayer = (id: string) => {
    if (!canvas) return;
    const obj = canvas.getObjects().find((o) => (o as any).__layerId === id);
    if (obj) {
      canvas.remove(obj);
      canvas.renderAll();
      refreshLayers();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Warstwy</span>
        <span className="text-xs text-gray-400">{layers.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-gray-400">
            Brak obiektów na canvas
          </div>
        )}

        {[...layers].reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`flex items-center gap-2 px-2 py-2 cursor-pointer border-b border-gray-100 group transition-colors ${
              selectedId === layer.id
                ? 'bg-amber-50 border-l-2 border-l-amber-400'
                : 'hover:bg-gray-50 border-l-2 border-l-transparent'
            }`}
          >
            <div className="w-10 h-10 rounded border border-gray-200 bg-white shrink-0 flex items-center justify-center overflow-hidden">
              {layer.thumbnail ? (
                <img
                  src={layer.thumbnail}
                  alt=""
                  className="w-full h-full object-contain"
                  style={{ opacity: layer.visible ? 1 : 0.3 }}
                />
              ) : (
                <span className="text-base opacity-50">{getTypeIcon(layer.type)}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span
                className={`text-xs block truncate ${
                  !layer.visible ? 'text-gray-300 line-through' : 'text-gray-700'
                }`}
              >
                {layer.name}
              </span>
              <div className="flex items-center gap-0.5 mt-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                  className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                  title="Przesuń wyżej"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                  className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                  title="Przesuń niżej"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
                  className={`p-0.5 rounded hover:bg-gray-200 ${layer.visible ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300'}`}
                  title={layer.visible ? 'Ukryj' : 'Pokaż'}
                >
                  {layer.visible ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
                  className={`p-0.5 rounded hover:bg-gray-200 ${layer.locked ? 'text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                  title={layer.locked ? 'Odblokuj' : 'Zablokuj'}
                >
                  {layer.locked ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                  className="p-0.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                  title="Usuń"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}