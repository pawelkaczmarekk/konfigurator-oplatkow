'use client';

import { ShapeConfig, ShapeType } from '@/types';
import SidebarSection from './SidebarSection';

interface ShapeSelectorProps {
  shape: ShapeConfig;
  onChange: (shape: ShapeConfig) => void;
}

const shapes: { type: ShapeType; label: string; desc: string }[] = [
  { type: 'rectangle', label: 'Prostokąt', desc: 'Cały arkusz A4' },
  { type: 'circle', label: 'Okrąg', desc: 'Okrągły opłatek' },
];

export default function ShapeSelector({ shape, onChange }: ShapeSelectorProps) {
  return (
    <SidebarSection label="Kształt opłatka" defaultOpen>
      <div className="space-y-2">
        {shapes.map((s) => (
          <button
            key={s.type}
            onClick={() => onChange({ ...shape, type: s.type })}
            className={`w-full text-left px-3 py-2 rounded-lg border-2 transition-colors ${
              shape.type === s.type
                ? 'border-amber-500 bg-amber-50 text-amber-900'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{s.label}</div>
            <div className="text-xs opacity-70">{s.desc}</div>
          </button>
        ))}
      </div>

      {shape.type !== 'rectangle' && (
        <div className="space-y-1 mt-3">
          <label className="text-xs text-gray-600">
            Średnica: {shape.diameter ?? 200} mm
          </label>
          <input
            type="range"
            min={80}
            max={200}
            value={shape.diameter ?? 200}
            onChange={(e) =>
              onChange({ ...shape, diameter: Number(e.target.value) })
            }
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>80 mm</span>
            <span>200 mm</span>
          </div>

          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={shape.showCutLine ?? false}
              onChange={(e) =>
                onChange({ ...shape, showCutLine: e.target.checked })
              }
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-gray-600">Linie do wycinania</span>
          </label>
        </div>
      )}
    </SidebarSection>
  );
}