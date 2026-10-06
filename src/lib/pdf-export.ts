import jsPDF from 'jspdf';
import { A4_WIDTH_MM, A4_HEIGHT_MM, A4_WIDTH_PX, A4_HEIGHT_PX } from '@/types';

export async function exportCanvasToPdf(
  canvasDataUrl: string
): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [A4_WIDTH_MM, A4_HEIGHT_MM],
  });

  pdf.addImage(
    canvasDataUrl,
    'PNG',
    0,
    0,
    A4_WIDTH_MM,
    A4_HEIGHT_MM
  );

  pdf.save('oplatek.pdf');
}

export function getCanvasDataUrl(
  canvas: import('fabric').Canvas
): string {
  const zoom = canvas.getZoom();
  canvas.setZoom(1);

  const objectsToHide: import('fabric').FabricObject[] = [];
  canvas.getObjects().forEach((obj) => {
    if ((obj as any).excludeFromExport === true) {
      objectsToHide.push(obj);
      obj.visible = false;
    }
  });

  canvas.renderAll();

  const dataUrl = canvas.toDataURL({
    format: 'png',
    multiplier: 300 / 96,
    left: 0,
    top: 0,
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
  });

  objectsToHide.forEach((obj) => {
    obj.visible = true;
  });
  canvas.renderAll();

  canvas.setZoom(zoom);
  return dataUrl;
}