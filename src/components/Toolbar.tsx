'use client';

import { Canvas } from 'fabric';

type CropMode = 'crop' | 'cut' | null;

interface ToolbarProps {
  canvas: Canvas | null;
  onCropMode: (mode: CropMode) => void;
}

export default function Toolbar({ canvas, onCropMode }: ToolbarProps) {
  const deleteSelected = () => {
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (active.length) {
      active.forEach((obj) => {
        if ((obj as any).name === '__a4_background__' || (obj as any).name === '__shape_guide__') return;
        canvas.remove(obj);
      });
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  };

  const bringForward = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      canvas.bringObjectForward(active);
      canvas.renderAll();
    }
  };

  const sendBackward = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      const bg = canvas.getObjects().find(o => (o as any).name === '__a4_background__');
      const guide = canvas.getObjects().find(o => (o as any).name === '__shape_guide__');
      canvas.sendObjectBackwards(active);
      if (bg) canvas.sendObjectToBack(bg!);
      if (guide) {
        const bgIdx = canvas.getObjects().indexOf(bg!);
        const guideIdx = canvas.getObjects().indexOf(guide!);
        if (guideIdx > bgIdx + 1) {
          canvas.sendObjectBackwards(guide);
        }
      }
      canvas.renderAll();
    }
  };

  const rotateLeft = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set('angle', (active.angle || 0) - 15);
      active.setCoords();
      canvas.renderAll();
    }
  };

  const rotateRight = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set('angle', (active.angle || 0) + 15);
      active.setCoords();
      canvas.renderAll();
    }
  };

  const flipH = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set('flipX', !active.flipX);
      canvas.renderAll();
    }
  };

  const flipV = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set('flipY', !active.flipY);
      canvas.renderAll();
    }
  };

  const duplicateSelected = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: any) => {
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  const btnClass =
    'p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';
  const iconClass = 'w-4 h-4 text-gray-600';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <button onClick={rotateLeft} className={btnClass} title="Obróć w lewo">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
        </svg>
      </button>
      <button onClick={rotateRight} className={btnClass} title="Obróć w prawo">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
        </svg>
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button onClick={flipH} className={btnClass} title="Odbij poziomo">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v18M17 3v18M3 12h18" />
        </svg>
      </button>
      <button onClick={flipV} className={btnClass} title="Odbij pionowo">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 17h18M12 3v18" />
        </svg>
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button onClick={bringForward} className={btnClass} title="Przesuń wyżej">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <button onClick={sendBackward} className={btnClass} title="Przesuń niżej">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button onClick={duplicateSelected} className={btnClass} title="Duplikuj">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <button onClick={() => onCropMode('crop')} className={btnClass} title="Kadruj zdjęcie">
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v3m0 0h10a2 2 0 012 2v10h3M7 6H4m3 0v10a2 2 0 002 2h10m0 0v3m0-3H9" />
        </svg>
      </button>
      <button onClick={() => onCropMode('cut')} className={btnClass} title="Wytnij fragment">
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      </button>
      <button onClick={deleteSelected} className={`${btnClass} hover:bg-red-50 hover:border-red-200`} title="Usuń">
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}