'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Rect, FabricImage } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '@/types';

interface CropToolProps {
  canvas: Canvas | null;
  mode: 'crop' | 'cut' | null;
  onDone: () => void;
}

const CROP_OVERLAY_ID = '__crop_overlay__';
const CROP_RECT_ID = '__crop_rect__';

export default function CropTool({ canvas, mode, onDone }: CropToolProps) {
  const sourceImageRef = useRef<FabricImage | null>(null);
  const [isReady, setIsReady] = useState(false);

  const cleanup = useCallback(() => {
    if (!canvas) return;
    const toRemove = canvas.getObjects().filter(
      (o) => (o as any).name === CROP_OVERLAY_ID || (o as any).name === CROP_RECT_ID
    );
    toRemove.forEach((o) => canvas.remove(o));
    canvas.renderAll();
  }, [canvas]);

  useEffect(() => {
    if (!canvas || !mode) return;

    const active = canvas.getActiveObject();
    if (!active || active.type !== 'image') {
      alert('Najpierw zaznacz zdjęcie');
      onDone();
      return;
    }

    sourceImageRef.current = active as FabricImage;
    canvas.discardActiveObject();

    const bounds = active.getBoundingRect();

    const overlay = new Rect({
      left: 0,
      top: 0,
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      fill: 'rgba(0,0,0,0.5)',
      selectable: false,
      evented: false,
      excludeFromExport: true,
    });
    (overlay as any).name = CROP_OVERLAY_ID;

    const cropRect = new Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      fill: 'transparent',
      stroke: '#fbbf24',
      strokeWidth: 2,
      strokeDashArray: [6, 3],
      selectable: true,
      evented: true,
      excludeFromExport: true,
      hasRotatingPoint: false,
      lockRotation: true,
    });
    (cropRect as any).name = CROP_RECT_ID;

    const hole = new Rect({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
      absolutePositioned: true,
      inverted: true,
    });
    overlay.clipPath = hole;

    cropRect.on('moving', () => {
      hole.set({ left: cropRect.left, top: cropRect.top });
      canvas.renderAll();
    });
    cropRect.on('scaling', () => {
      hole.set({
        left: cropRect.left,
        top: cropRect.top,
        width: (cropRect.width || 0) * (cropRect.scaleX || 1),
        height: (cropRect.height || 0) * (cropRect.scaleY || 1),
      });
      canvas.renderAll();
    });

    canvas.add(overlay);
    canvas.add(cropRect);
    canvas.setActiveObject(cropRect);
    canvas.renderAll();
    setIsReady(true);

    return () => {
      cleanup();
    };
  }, [canvas, mode, cleanup, onDone]);

  const applyCrop = useCallback(async () => {
    if (!canvas || !sourceImageRef.current) return;

    const cropRect = canvas.getObjects().find((o) => (o as any).name === CROP_RECT_ID) as Rect | undefined;
    if (!cropRect) return;

    const sourceImage = sourceImageRef.current;

    const imgElement = sourceImage.getElement();
    if (!imgElement) return;

    const cropBounds = cropRect.getBoundingRect();
    const imageBounds = sourceImage.getBoundingRect();

    const intersectLeft = Math.max(cropBounds.left, imageBounds.left);
    const intersectTop = Math.max(cropBounds.top, imageBounds.top);
    const intersectRight = Math.min(
      cropBounds.left + cropBounds.width,
      imageBounds.left + imageBounds.width
    );
    const intersectBottom = Math.min(
      cropBounds.top + cropBounds.height,
      imageBounds.top + imageBounds.height
    );

    if (intersectRight <= intersectLeft || intersectBottom <= intersectTop) {
      alert('Obszar kadrowania jest poza zdjęciem');
      return;
    }

    const localLeft = (intersectLeft - sourceImage.left!) / sourceImage.scaleX!;
    const localTop = (intersectTop - sourceImage.top!) / sourceImage.scaleY!;
    const localWidth = (intersectRight - intersectLeft) / sourceImage.scaleX!;
    const localHeight = (intersectBottom - intersectTop) / sourceImage.scaleY!;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.max(1, Math.round(localWidth));
    tempCanvas.height = Math.max(1, Math.round(localHeight));
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgElement,
      localLeft,
      localTop,
      localWidth,
      localHeight,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );

    const dataUrl = tempCanvas.toDataURL('image/png');

    if (mode === 'crop') {
      canvas.remove(sourceImage);
    }

    const newImg = await FabricImage.fromURL(dataUrl);
    newImg.set({
      left: intersectLeft,
      top: intersectTop,
      scaleX: (intersectRight - intersectLeft) / (newImg.width || 1),
      scaleY: (intersectBottom - intersectTop) / (newImg.height || 1),
    });

    canvas.add(newImg);
    canvas.setActiveObject(newImg);
    cleanup();
    setIsReady(false);
    onDone();
  }, [canvas, mode, cleanup, onDone]);

  const handleCancel = useCallback(() => {
    cleanup();
    setIsReady(false);
    onDone();
  }, [cleanup, onDone]);

  if (!mode || !isReady) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
      <button
        onClick={applyCrop}
        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors font-medium text-sm"
      >
        {mode === 'crop' ? 'Zatwierdź kadrowanie' : 'Wytnij fragment'}
      </button>
      <button
        onClick={handleCancel}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium text-sm"
      >
        Anuluj
      </button>
    </div>
  );
}