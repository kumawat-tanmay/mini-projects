"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { NOTE_COLORS } from '../types';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  label?: string;
}

export default function ColorPicker({ currentColor, onColorChange, label = 'Color' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-1.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
        title={label}
      >
        <Palette size={14} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-xl border border-black/10 dark:border-neutral-700/10 flex gap-2 z-50">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onColorChange(c);
                setIsOpen(false);
              }}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                currentColor === c ? 'border-black dark:border-neutral-700 scale-110' : 'border-black/20 dark:border-neutral-700/20'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
}
