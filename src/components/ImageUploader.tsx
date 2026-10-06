'use client';

import { useCallback, useState } from 'react';
import { Canvas, FabricImage, loadSVGFromString, Group } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '@/types';
import SidebarSection from './SidebarSection';

interface ImageUploaderProps {
  canvas: Canvas | null;
}

export default function ImageUploader({ canvas }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const addImageToCanvas = useCallback(
    async (file: File) => {
      if (!canvas) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        try {
          const img = await FabricImage.fromURL(dataUrl);

          const maxW = A4_WIDTH_PX * 0.5;
          const maxH = A4_HEIGHT_PX * 0.5;
          const scale = Math.min(maxW / (img.width || 1), maxH / (img.height || 1), 1);

          img.set({
            left: A4_WIDTH_PX / 2 - ((img.width || 0) * scale) / 2,
            top: A4_HEIGHT_PX / 2 - ((img.height || 0) * scale) / 2,
            scaleX: scale,
            scaleY: scale,
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        } catch (err) {
          console.error('Błąd dodawania obrazu:', err);
        }
      };
      reader.readAsDataURL(file);
    },
    [canvas]
  );

  const addSvgToCanvas = useCallback(
    async (file: File) => {
      if (!canvas) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const svgString = e.target?.result as string;
        if (!svgString) return;

        try {
          const parsed = await (loadSVGFromString as any)(svgString);
          const objects: any[] = parsed.objects;

          if (!objects || objects.length === 0) return;

          const group = new Group(objects, parsed.options);

          const maxW = A4_WIDTH_PX * 0.6;
          const maxH = A4_HEIGHT_PX * 0.6;
          const scale = Math.min(maxW / (group.width || 1), maxH / (group.height || 1), 1);

          const offsetX = A4_WIDTH_PX / 2 - ((group.width || 0) * scale) / 2;
          const offsetY = A4_HEIGHT_PX / 2 - ((group.height || 0) * scale) / 2;

          const items = group.getObjects();
          for (const obj of items) {
            const objLeft = (obj.left || 0) * scale + offsetX;
            const objTop = (obj.top || 0) * scale + offsetY;
            obj.set({
              left: objLeft,
              top: objTop,
              scaleX: (obj.scaleX || 1) * scale,
              scaleY: (obj.scaleY || 1) * scale,
            });
            obj.setCoords();
            canvas.add(obj);
          }

          canvas.renderAll();
        } catch (err) {
          console.error('Błąd dodawania SVG:', err);
        }
      };
      reader.readAsText(file);
    },
    [canvas]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
        addSvgToCanvas(file);
      } else {
        addImageToCanvas(file);
      }
    },
    [addImageToCanvas, addSvgToCanvas]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/') || f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg')
      );
      files.forEach((file) => handleFile(file));
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) =>
        f.type.startsWith('image/') || f.type === 'image/svg+xml' || f.name.toLowerCase().endsWith('.svg')
      );
      files.forEach((file) => handleFile(file));
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <SidebarSection label="Twoja grafika" defaultOpen={false}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          isDragging
            ? 'border-amber-500 bg-amber-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onClick={() => document.getElementById('image-upload-input')?.click()}
      >
        <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-xs text-gray-500">
          Przeciągnij obraz / SVG lub kliknij
        </p>
        <input
          id="image-upload-input"
          type="file"
          accept="image/*,.svg"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </SidebarSection>
  );
}