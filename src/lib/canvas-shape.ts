import { Canvas, Rect, Circle, FabricObject } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX, MARGIN_PX, CONTENT_WIDTH_PX, CONTENT_HEIGHT_PX, ShapeConfig } from '@/types';

const SHAPE_OVERLAY_ID = '__shape_overlay__';
const CUT_LINE_ID = '__cut_line__';
const MARGIN_OVERLAY_ID = '__margin_overlay__';
export const SYSTEM_OBJECTS = new Set(['__a4_background__', SHAPE_OVERLAY_ID, CUT_LINE_ID, MARGIN_OVERLAY_ID]);

function createShapeClipPath(shape: ShapeConfig): Circle | undefined {
  if (shape.type === 'rectangle') return undefined;

  const diameter = (shape.diameter ?? 200) * (A4_WIDTH_PX / 210);
  const radius = diameter / 2;
  return new Circle({
    left: A4_WIDTH_PX / 2 - radius,
    top: A4_HEIGHT_PX / 2 - radius,
    radius,
    absolutePositioned: true,
  });
}

function createMarginClipPath(): Rect {
  return new Rect({
    left: MARGIN_PX,
    top: MARGIN_PX,
    width: CONTENT_WIDTH_PX,
    height: CONTENT_HEIGHT_PX,
    absolutePositioned: true,
  });
}

function createMarginOverlay(): Rect {
  const clipPath = createMarginClipPath();
  const overlay = new Rect({
    left: 0,
    top: 0,
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    fill: 'rgba(0, 0, 0, 0.15)',
    selectable: false,
    evented: false,
    excludeFromExport: true,
  });
  (clipPath as any).inverted = true;
  overlay.clipPath = clipPath;
  return overlay;
}

function createShapeOverlay(shape: ShapeConfig): Rect | undefined {
  if (shape.type === 'rectangle') return undefined;

  const clipPath = createShapeClipPath(shape);
  if (!clipPath) return undefined;

  const overlay = new Rect({
    left: 0,
    top: 0,
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
    fill: 'rgba(0, 0, 0, 0.35)',
    selectable: false,
    evented: false,
    excludeFromExport: true,
  });

  (clipPath as any).inverted = true;
  overlay.clipPath = clipPath;

  return overlay;
}

function createCutLine(shape: ShapeConfig): Circle | undefined {
  if (shape.type === 'rectangle' || !shape.showCutLine) return undefined;

  const diameter = (shape.diameter ?? 200) * (A4_WIDTH_PX / 210);
  const cutDiameter = diameter + 2 * (A4_WIDTH_PX / 210) * 0.5;
  const radius = cutDiameter / 2;

  return new Circle({
    left: A4_WIDTH_PX / 2 - radius,
    top: A4_HEIGHT_PX / 2 - radius,
    radius,
    fill: 'transparent',
    stroke: '#cccccc',
    strokeWidth: 2,
    strokeDashArray: [10, 5],
    selectable: false,
    evented: false,
    excludeFromExport: false,
  });
}

function createObjectClipPath(shape: ShapeConfig): Circle | Rect | undefined {
  if (shape.type !== 'rectangle') {
    return createShapeClipPath(shape);
  }
  return createMarginClipPath();
}

function isUserObject(obj: FabricObject): boolean {
  return !SYSTEM_OBJECTS.has((obj as any).name);
}

export function applyShapeToCanvas(canvas: Canvas, shape: ShapeConfig) {
  const existingOverlay = canvas.getObjects().find(o => (o as any).name === SHAPE_OVERLAY_ID);
  const existingCutLine = canvas.getObjects().find(o => (o as any).name === CUT_LINE_ID);
  const existingMarginOverlay = canvas.getObjects().find(o => (o as any).name === MARGIN_OVERLAY_ID);
  if (existingOverlay) canvas.remove(existingOverlay);
  if (existingCutLine) canvas.remove(existingCutLine);
  if (existingMarginOverlay) canvas.remove(existingMarginOverlay);

  (canvas as any).clipPath = undefined;

  const marginOverlay = createMarginOverlay();
  (marginOverlay as any).name = MARGIN_OVERLAY_ID;
  canvas.add(marginOverlay);
  canvas.sendObjectToBack(marginOverlay);

  if (shape.type !== 'rectangle') {
    canvas.getObjects().forEach((obj) => {
      if (isUserObject(obj)) {
        (obj as any).clipPath = createObjectClipPath(shape);
      }
    });

    const overlay = createShapeOverlay(shape);
    if (overlay) {
      (overlay as any).name = SHAPE_OVERLAY_ID;
      canvas.add(overlay);
      canvas.sendObjectToBack(overlay);
      const mo = canvas.getObjects().find(o => (o as any).name === MARGIN_OVERLAY_ID);
      if (mo) canvas.sendObjectToBack(mo);
    }

    const cutLine = createCutLine(shape);
    if (cutLine) {
      (cutLine as any).name = CUT_LINE_ID;
      canvas.add(cutLine);
      canvas.bringObjectToFront(cutLine);
    }
  } else {
    canvas.getObjects().forEach((obj) => {
      if (isUserObject(obj)) {
        (obj as any).clipPath = createObjectClipPath(shape);
      }
    });
  }

  const bg = canvas.getObjects().find(o => (o as any).name === '__a4_background__');
  if (bg) canvas.sendObjectToBack(bg);
  canvas.renderAll();
}

export function applyClipPathToObject(obj: FabricObject, shape: ShapeConfig) {
  if (!isUserObject(obj)) return;
  (obj as any).clipPath = createObjectClipPath(shape);
}