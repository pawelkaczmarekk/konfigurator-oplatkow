'use client';

import { Canvas } from 'fabric';

type MobileTool = 'shape' | 'gallery' | 'upload' | 'text' | 'layers' | null;
type CropMode = 'crop' | 'cut' | null;

interface MobileBottomBarProps {
  canvas: Canvas | null;
  activeTool: MobileTool;
  onToolSelect: (tool: MobileTool) => void;
  onCropMode: (mode: CropMode) => void;
}

export default function MobileBottomBar({ canvas, activeTool, onToolSelect, onCropMode }: MobileBottomBarProps) {
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
    if (active) { canvas.bringObjectForward(active); canvas.renderAll(); }
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
        if (guideIdx > bgIdx + 1) canvas.sendObjectBackwards(guide);
      }
      canvas.renderAll();
    }
  };

  const rotateLeft = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) { active.set('angle', (active.angle || 0) - 15); active.setCoords(); canvas.renderAll(); }
  };

  const rotateRight = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) { active.set('angle', (active.angle || 0) + 15); active.setCoords(); canvas.renderAll(); }
  };

  const flipH = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) { active.set('flipX', !active.flipX); canvas.renderAll(); }
  };

  const flipV = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) { active.set('flipY', !active.flipY); canvas.renderAll(); }
  };

  const duplicateSelected = () => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: any) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  };

  const toolBtn = (tool: MobileTool, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => onToolSelect(activeTool === tool ? null : tool)}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
        activeTool === tool
          ? 'text-amber-700 bg-amber-50'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  const actionBtn = (onClick: () => void, label: string, icon: React.ReactNode, danger?: boolean) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
        danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around px-1 py-1">
        {toolBtn('shape', 'Kształt',
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16v16H4z" />
          </svg>
        )}
        {toolBtn('gallery', 'Galeria',
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {toolBtn('upload', 'Grafika',
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        )}
        {toolBtn('text', 'Tekst',
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )}
        {toolBtn('layers', 'Warstwy',
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )}
      </div>
      <div className="flex items-center justify-center gap-0.5 px-2 py-1 border-t border-gray-100 overflow-x-auto">
        {actionBtn(rotateLeft, 'Obróć',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
          </svg>
        )}
        {actionBtn(rotateRight, 'Obróć',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" />
          </svg>
        )}
        {actionBtn(flipH, 'Odbij H',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v18M17 3v18M3 12h18" />
          </svg>
        )}
        {actionBtn(flipV, 'Odbij V',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 17h18M12 3v18" />
          </svg>
        )}
        {actionBtn(bringForward, 'Wyżej',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
        {actionBtn(sendBackward, 'Niżej',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
        {actionBtn(duplicateSelected, 'Kopiuj',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
        {actionBtn(() => onCropMode('crop'), 'Kadruj',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3v3m0 0h10a2 2 0 012 2v10h3M7 6H4m3 0v10a2 2 0 002 2h10m0 0v3m0-3H9" />
          </svg>
        )}
        {actionBtn(() => onCropMode('cut'), 'Wytnij',
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
          </svg>
        )}
        {actionBtn(deleteSelected, 'Usuń',
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>,
          true
        )}
      </div>
    </div>
  );
}