"use client";

import React from 'react';
import { StickyNote, Plus } from 'lucide-react';

interface EmptyStateProps {
  onCreateNote: () => void;
}

export default function EmptyState({ onCreateNote }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      <div className="relative">
        <div className="w-32 h-32 bg-yellow-300 rounded-lg shadow-lg rotate-3 flex items-center justify-center">
          <StickyNote size={48} className="text-yellow-700" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-pink-300 rounded-lg shadow-md -rotate-12" />
        <div className="absolute -bottom-2 -left-3 w-10 h-10 bg-blue-300 rounded-lg shadow-md rotate-6" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
          No Notes Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 font-bold max-w-sm">
          Create your first sticky note and start capturing your ideas!
        </p>
      </div>

      <button
        onClick={onCreateNote}
        className="group relative"
      >
        <div className="absolute inset-0 bg-black dark:bg-neutral-700 translate-y-1 translate-x-1 group-hover:translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
        <div className="relative bg-yellow-400 border-4 border-black dark:border-neutral-700 px-8 py-4 flex items-center gap-3 font-black uppercase tracking-widest text-black transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0">
          <Plus size={20} strokeWidth={3} />
          Create First Note
        </div>
      </button>
    </div>
  );
}
