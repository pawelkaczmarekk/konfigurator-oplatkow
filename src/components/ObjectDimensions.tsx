'use client';

import { useEffect, useState } from 'react';
import { Canvas } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX, A4_WIDTH_MM, A4_HEIGHT_MM } from '@/types';

interface ObjectDimensionsProps {
  canvas: Canvas | null;
}

const PX_TO_MM_X = A4_WIDTH_MM / A4_WIDTH_PX;
const PX_TO_MM_Y = A4_HEIGHT_MM / A4_HEIGHT_PX;

interface Dimensions {
  widthCm: number;
  heightCm: number;
}

export default function ObjectDimensions({ canvas }: ObjectDimensionsProps) {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  useEffect(() => {
    if (!canvas) return;

    const update = () => {
      const obj = canvas.getActiveObject();
      if (!obj || (obj as any).name === '__a4_background__' || (obj as any).name === '__shape_guide__') {
        setDimensions(null);
        return;
      }

      const w = (obj.getScaledWidth() || 0) * PX_TO_MM_X / 10;
      const h = (obj.getScaledHeight() || 0) * PX_TO_MM_Y / 10;

      setDimensions({
        widthCm: Math.round(w * 10) / 10,
        heightCm: Math.round(h * 10) / 10,
      });
    };

    canvas.on('selection:created', update);
    canvas.on('selection:updated', update);
    canvas.on('selection:cleared', () => setDimensions(null));
    canvas.on('object:modified', update);
    canvas.on('object:scaling', update);

    return () => {
      canvas.off('selection:created', update);
      canvas.off('selection:updated', update);
      canvas.off('selection:cleared');
      canvas.off('object:modified', update);
      canvas.off('object:scaling', update);
    };
  }, [canvas]);

  if (!dimensions) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
      </svg>
      <span className="text-amber-800 font-mono font-medium">
        {dimensions.widthCm} × {dimensions.heightCm} cm
      </span>
    </div>
  );
}