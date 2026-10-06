export type ShapeType = 'rectangle' | 'circle';

export interface ShapeConfig {
  type: ShapeType;
  diameter?: number;
  showCutLine?: boolean;
}

export interface ProjectData {
  id: string;
  canvasJson: string;
  shape: ShapeConfig;
  createdAt: string;
}

export interface PatternItem {
  id: string;
  name: string;
  src: string;
  category: string;
  tags?: string[];
}

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const MARGIN_MM = 5;
export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;
export const MARGIN_PX = Math.round(A4_WIDTH_PX * MARGIN_MM / A4_WIDTH_MM);
export const CONTENT_WIDTH_PX = A4_WIDTH_PX - 2 * MARGIN_PX;
export const CONTENT_HEIGHT_PX = A4_HEIGHT_PX - 2 * MARGIN_PX;
export const DPI = 96;