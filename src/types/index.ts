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

export const CARD_WIDTH_MM = 204;
export const CARD_HEIGHT_MM = 283;
export const MARGIN_TOP_MM = 11;
export const MARGIN_SIDE_MM = 3;
export const MARGIN_BOTTOM_MM = 3;
export const CARD_WIDTH_PX = 771;
export const CARD_HEIGHT_PX = 1069;
export const MARGIN_TOP_PX = Math.round(CARD_WIDTH_PX * MARGIN_TOP_MM / CARD_WIDTH_MM);
export const MARGIN_SIDE_PX = Math.round(CARD_WIDTH_PX * MARGIN_SIDE_MM / CARD_WIDTH_MM);
export const MARGIN_BOTTOM_PX = Math.round(CARD_WIDTH_PX * MARGIN_BOTTOM_MM / CARD_WIDTH_MM);
export const CONTENT_WIDTH_PX = CARD_WIDTH_PX - 2 * MARGIN_SIDE_PX;
export const CONTENT_HEIGHT_PX = CARD_HEIGHT_PX - MARGIN_TOP_PX - MARGIN_BOTTOM_PX;
export const DPI = 96;