"use client";

import React from 'react';
import { Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ 
  title, 
  description, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel 
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-900 border-4 border-black dark:border-neutral-700 p-8 max-w-md w-full mx-4 shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff]">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-black dark:text-white hover:opacity-60 transition-opacity"
        >
          <X size={24} strokeWidth={3} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-500 text-white">
            <Trash2 size={24} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
            {title}
          </h2>
        </div>

        <div className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-6">
          {description}
        </div>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-4 border-black font-black uppercase tracking-widest text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 border-4 border-black text-black font-black uppercase tracking-widest text-sm hover:bg-red-600 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
