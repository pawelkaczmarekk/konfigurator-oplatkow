'use client';

import { useEffect, useRef } from 'react';
import { Canvas, Rect } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX, ShapeConfig } from '@/types';
import { applyShapeToCanvas, applyClipPathToObject } from '@/lib/canvas-shape';

interface FabricCanvasProps {
  onReady: (canvas: Canvas) => void;
  shape: ShapeConfig;
}

export default function FabricCanvas({ onReady, shape }: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const onReadyRef = useRef(onReady);
  const shapeRef = useRef(shape);
  onReadyRef.current = onReady;
  shapeRef.current = shape;

  useEffect(() => {
    if (!containerRef.current) return;

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
      selection: true,
    });

    canvas.setZoom(scale);

    const bg = new Rect({
      left: 0,
      top: 0,
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX,
      fill: '#ffffff',
      selectable: false,
      evented: false,
      excludeFromExport: true,
      name: '__a4_background__' as any,
    });
    canvas.add(bg);
    canvas.sendObjectToBack(bg);

    canvasRef.current = canvas;
    onReadyRef.current(canvas);

    canvas.on('object:added', (e) => {
      if (e.target) {
        applyClipPathToObject(e.target, shapeRef.current);
      }
    });

    return () => {
      canvas.dispose();
      if (container.contains(el)) {
        container.removeChild(el);
      }
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      applyShapeToCanvas(canvasRef.current, shape);
    }
  }, [shape]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
    />
  );
}