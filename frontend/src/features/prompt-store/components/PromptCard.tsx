"use client";

import React, { useRef, useState } from 'react';
import { Copy, Trash2, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { disintegrate } from '../../../utils/thanosSnap';
import type { Prompt } from '../types';

interface PromptCardProps {
  prompt: Prompt;
  isActive: boolean;
  onClick: (prompt: Prompt) => void;
  onDelete: (id: string) => void;
}

const PROMPT_COLORS = [
  '#FDE047', // Yellow
  '#7DD3FC', // Sky
  '#6EE7B7', // Emerald
  '#FDA4AF', // Rose/Red
  '#FDBA74', // Orange
  '#D8B4FE', // Purple
];

const PromptCard = ({ prompt, isActive, onClick, onDelete }: PromptCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAnimatingDelete, setIsAnimatingDelete] = useState(false);

  // Generate consistent color from ID
  const colorIndex = prompt._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % PROMPT_COLORS.length;
  const bgColor = PROMPT_COLORS[colorIndex];

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening editor
    navigator.clipboard.writeText(prompt.content);
    setIsCopied(true);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(false);
    setIsAnimatingDelete(true);

    if (cardRef.current) {
      await disintegrate(cardRef.current, () => {
        onDelete(prompt._id);
      });
    } else {
      onDelete(prompt._id);
    }
  };

  return (
    <div
      id={`prompt-card-${prompt._id}`}
      ref={cardRef}
      onClick={() => !showDeleteModal && !isAnimatingDelete && onClick(prompt)}
      className={`group relative w-full h-[150px] flex flex-col text-black border ${
        isActive ? 'border-black dark:border-neutral-700 scale-[1.02]' : 'border-black dark:border-neutral-700/50'
      } cursor-pointer transition-all duration-300 ${
        !isAnimatingDelete && !showDeleteModal ? 'hover:-translate-y-1' : ''
      } ${isAnimatingDelete ? 'pointer-events-none' : ''}`}
      style={{
        backgroundColor: bgColor,
      }}
    >
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center p-4 text-center border border-black">
          <p className="text-white font-black uppercase tracking-widest text-xs mb-4">Delete?</p>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }}
              className="px-3 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors border-2 border-transparent"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors border-2 border-transparent"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full flex justify-between items-start p-3 border-b border-black bg-black/5">
        <div className="font-black text-sm uppercase tracking-wider break-all min-w-0 mr-2">
          {prompt.title || <span className="opacity-40">UNTITLED</span>}
        </div>
        
        <div className="flex gap-2 transition-opacity shrink-0">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-black hover:text-white transition-colors"
            title="Copy prompt"
          >
            {isCopied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
            className="p-1 hover:bg-red-500 hover:text-white text-red-600 transition-colors"
            title="Delete prompt"
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Preview Snippet */}
      <div className="flex-1 p-3 overflow-hidden">
        <p className="font-mono text-xs opacity-70 line-clamp-3 leading-relaxed break-words">
          {prompt.content || "No content..."}
        </p>
      </div>
    </div>
  );
};

export default React.memo(PromptCard, (prev, next) => {
  return prev.prompt === next.prompt && prev.isActive === next.isActive;
});
