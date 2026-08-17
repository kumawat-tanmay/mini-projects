import React, { useState, useEffect } from 'react';
import { Edit3, X } from 'lucide-react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptModal({
  isOpen,
  title,
  placeholder = 'Enter value',
  defaultValue,
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal Box */}
      <form 
        onSubmit={handleSubmit}
        className="relative bg-white dark:bg-neutral-900 border-4 border-black dark:border-neutral-700 p-8 max-w-sm w-full mx-4 shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff] transition-all"
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-black dark:text-white hover:opacity-60 transition-opacity"
        >
          <X size={20} strokeWidth={3} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-400 text-black border-2 border-black">
            <Edit3 size={18} strokeWidth={2.5} className="text-black" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">
            {title}
          </h2>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          required
          autoFocus
          className="w-full border-4 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 p-2.5 text-sm font-bold text-black dark:text-white outline-none mb-6 focus:border-yellow-400 dark:focus:border-yellow-400 transition-colors"
        />

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border-4 border-black dark:border-neutral-700 font-black uppercase tracking-widest text-xs text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-yellow-400 border-4 border-black text-black font-black uppercase tracking-widest text-xs hover:bg-yellow-500 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </form>
    </div>
  );
}
