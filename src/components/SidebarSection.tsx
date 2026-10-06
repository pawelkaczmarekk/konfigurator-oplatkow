'use client';

import { useState, ReactNode } from 'react';

interface SidebarSectionProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function SidebarSection({ label, defaultOpen = false, children }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-1 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wide hover:text-amber-700 transition-colors"
      >
        {label}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-3">{children}</div>
      </div>
    </div>
  );
}