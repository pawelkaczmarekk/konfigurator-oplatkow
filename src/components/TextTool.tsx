'use client';

import { useState, useEffect, useCallback } from 'react';
import { Canvas, IText } from 'fabric';
import { A4_WIDTH_PX, A4_HEIGHT_PX } from '@/types';
import SidebarSection from './SidebarSection';

interface TextToolProps {
  canvas: Canvas | null;
}

const FONTS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96];

export default function TextTool({ canvas }: TextToolProps) {
  const [activeText, setActiveText] = useState<IText | null>(null);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState<string>('left');
  const [textColor, setTextColor] = useState('#000000');

  useEffect(() => {
    if (!canvas) return;

    const onSelect = () => {
      const obj = canvas.getActiveObject();
      if (obj && obj.type === 'i-text') {
        const t = obj as IText;
        setActiveText(t);
        setFontFamily(t.fontFamily || 'Arial');
        setFontSize(t.fontSize || 24);
        setIsBold((t.fontWeight as string) === 'bold');
        setIsItalic(t.fontStyle === 'italic');
        setIsUnderline(!!t.underline);
        setTextAlign(t.textAlign || 'left');
        setTextColor(t.fill as string || '#000000');
      } else {
        setActiveText(null);
      }
    };

    const onClear = () => setActiveText(null);

    canvas.on('selection:created', onSelect);
    canvas.on('selection:updated', onSelect);
    canvas.on('selection:cleared', onClear);

    return () => {
      canvas.off('selection:created', onSelect);
      canvas.off('selection:updated', onSelect);
      canvas.off('selection:cleared', onClear);
    };
  }, [canvas]);

  const addText = useCallback(() => {
    if (!canvas) return;

    const text = new IText('Wpisz tekst', {
      left: A4_WIDTH_PX / 2 - 80,
      top: A4_HEIGHT_PX / 2 - 20,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#000000',
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();
  }, [canvas]);

  const applyProp = useCallback((prop: string, value: any) => {
    if (!canvas || !activeText) return;
    (activeText as any).set(prop, value);
    canvas.renderAll();
  }, [canvas, activeText]);

  const handleFontFamily = (val: string) => {
    setFontFamily(val);
    applyProp('fontFamily', val);
  };

  const handleFontSize = (val: number) => {
    setFontSize(val);
    applyProp('fontSize', val);
  };

  const handleBold = () => {
    const next = !isBold;
    setIsBold(next);
    applyProp('fontWeight', next ? 'bold' : 'normal');
  };

  const handleItalic = () => {
    const next = !isItalic;
    setIsItalic(next);
    applyProp('fontStyle', next ? 'italic' : 'normal');
  };

  const handleUnderline = () => {
    const next = !isUnderline;
    setIsUnderline(next);
    applyProp('underline', next);
  };

  const handleAlign = (align: string) => {
    setTextAlign(align);
    applyProp('textAlign', align);
  };

  const handleColor = (color: string) => {
    setTextColor(color);
    applyProp('fill', color);
  };

  const selectClass = 'w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-400';
  const toggleBtn = (active: boolean) =>
    `p-1.5 rounded-md border transition-colors ${
      active ? 'bg-amber-100 border-amber-400 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <SidebarSection label="Tekst" defaultOpen={false}>
      <button
        onClick={addText}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-200 bg-white hover:border-amber-400 hover:bg-amber-50 transition-colors text-sm font-medium text-gray-700 mb-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Dodaj tekst
      </button>

      {activeText && (
        <div className="space-y-2">
          <select
            value={fontFamily}
            onChange={(e) => handleFontFamily(e.target.value)}
            className={selectClass}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            <select
              value={fontSize}
              onChange={(e) => handleFontSize(Number(e.target.value))}
              className={`${selectClass} w-20`}
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button onClick={handleBold} className={toggleBtn(isBold)} title="Pogrubienie">
              <span className="text-sm font-bold">B</span>
            </button>
            <button onClick={handleItalic} className={toggleBtn(isItalic)} title="Kursywa">
              <span className="text-sm italic">I</span>
            </button>
            <button onClick={handleUnderline} className={toggleBtn(isUnderline)} title="Podkreślenie">
              <span className="text-sm underline">U</span>
            </button>
          </div>

          <div className="flex gap-1">
            {['left', 'center', 'right'].map((align) => (
              <button
                key={align}
                onClick={() => handleAlign(align)}
                className={toggleBtn(textAlign === align)}
                title={align === 'left' ? 'Do lewej' : align === 'center' ? 'Wyśrodkuj' : 'Do prawej'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {align === 'left' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                  )}
                  {align === 'center' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                  )}
                  {align === 'right' && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                  )}
                </svg>
              </button>
            ))}

            <div className="flex-1" />

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="color"
                value={textColor}
                onChange={(e) => handleColor(e.target.value)}
                className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0"
              />
            </label>
          </div>
        </div>
      )}
    </SidebarSection>
  );
}