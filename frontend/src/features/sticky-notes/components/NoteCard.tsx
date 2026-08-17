"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Pin, Check, Trash2, Copy } from 'lucide-react';
import gsap from 'gsap';
import { disintegrate } from '../../../utils/thanosSnap';
import type { StickyNote } from '../types';
import ColorPicker from './ColorPicker';
import { toast } from 'react-toastify';

interface NoteCardProps {
  note: StickyNote;
  rotation: number;
  onEdit: (id: string, updates: Partial<StickyNote>) => void;
  onTogglePin: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeTextColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

const NoteCard = ({
  note,
  rotation,
  onEdit,
  onTogglePin,
  onToggleComplete,
  onChangeColor,
  onChangeTextColor,
  onDelete,
}: NoteCardProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAnimatingDelete, setIsAnimatingDelete] = useState(false);

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsAnimatingDelete(true);

    if (cardRef.current) {
      await disintegrate(cardRef.current, () => {
        onDelete(note._id);
      });
    } else {
      onDelete(note._id);
    }
  };

  const handleCopy = async () => {
    try {
      const textToCopy = `${note.title ? note.title + '\n\n' : ''}${note.content}`.trim();
      if (!textToCopy) return;
      await navigator.clipboard.writeText(textToCopy);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Sync local state when note prop changes (e.g. from server)
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.title, note.content]);

  // Auto-focus title on new note (empty title + content)
  useEffect(() => {
    if (!note.title && !note.content && titleRef.current) {
      setIsEditingTitle(true);
      titleRef.current.focus();
    }
  }, []);

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title !== note.title) {
      onEdit(note._id, { title });
    }
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    // Debounced auto-save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onEdit(note._id, { content: val });
    }, 500);
  };

  const handleContentBlur = () => {
    setIsEditingContent(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (content !== note.content) {
      onEdit(note._id, { content });
    }
  };

  const timeAgo = () => {
    const diff = Date.now() - new Date(note.updatedAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div
      ref={cardRef}
      className={`note-card group relative w-full h-64 rounded-lg transition-all duration-300 ${!isAnimatingDelete && !showDeleteModal ? 'hover:-translate-y-1' : ''} cursor-default ${
        note.isCompleted ? 'opacity-60' : ''
      } ${isAnimatingDelete ? 'pointer-events-none' : ''}`}
      style={{
        backgroundColor: note.bgColor,
        color: note.textColor,
        transform: `rotate(${rotation}deg)`,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1), 4px 4px 0px rgba(0,0,0,0.15)',
      }}
    >


      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-40 bg-black/85 rounded-lg flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm border-4 border-black">
          <p className="text-white font-black uppercase tracking-widest text-xs mb-4">Delete Note?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
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

      <div className="note-inner relative w-full h-full flex flex-col">
      {/* Folded Corner Effect */}
      <div 
        className="absolute bottom-0 right-0 w-8 h-8 rounded-tl-lg"
        style={{
          background: `linear-gradient(135deg, ${note.bgColor} 50%, rgba(0,0,0,0.08) 50%)`,
        }}
      />

      {/* Pin Indicator */}
      {note.isPinned && (
        <div className={`absolute -top-2 -right-2 z-10 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md transition-opacity duration-200 ${
          showDeleteModal ? 'opacity-0' : 'opacity-100'
        }`}>
          <Pin size={14} className="text-white" fill="white" strokeWidth={2} />
        </div>
      )}

      {/* Action Buttons — hidden while editing content to prevent overlapping the character counter */}
      <div className={`absolute bottom-2 right-2 flex items-center gap-1 transition-opacity duration-200 z-20 ${
        isEditingContent ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          onClick={() => onTogglePin(note._id)}
          className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
          title={note.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        <button
          onClick={() => onToggleComplete(note._id)}
          className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
          title={note.isCompleted ? 'Mark active' : 'Mark complete'}
        >
          <Check size={14} strokeWidth={note.isCompleted ? 3 : 2} />
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
          title="Copy"
        >
          <Copy size={14} strokeWidth={2} />
        </button>
        <ColorPicker
          currentColor={note.bgColor}
          onColorChange={(c) => onChangeColor(note._id, c)}
          label="Background color"
        />
        <button
          onClick={() => setShowDeleteModal(true)}
          className="p-1.5 rounded-full hover:bg-red-500/20 text-red-600 transition-colors"
          title="Delete"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Note Content */}
      <div className="p-4 h-full flex flex-col overflow-hidden">
        {/* Title */}
        {isEditingTitle ? (
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()}
            maxLength={100}
            className="font-black text-base bg-transparent border-b-2 border-current/30 pb-2 mb-2 outline-none w-full placeholder:opacity-40"
            placeholder="Title..."
            style={{ color: note.textColor }}
          />
        ) : (
          <div
            onClick={() => !note.isCompleted && setIsEditingTitle(true)}
            className={`font-black text-base border-b-2 border-current/30 pb-2 mb-2 ${!note.isCompleted ? 'cursor-text' : 'cursor-default'} min-h-[32px] flex items-end ${
              note.isCompleted ? 'line-through' : ''
            } ${!title ? 'opacity-40' : ''}`}
          >
            {title || 'Click to add title...'}
          </div>
        )}

        {/* Content */}
        <div 
          className={`flex-1 rounded p-2 bg-black/5 shadow-inner ${isEditingContent ? 'overflow-hidden' : 'overflow-y-auto'}`} 
          data-lenis-prevent="true"
        >
          {isEditingContent ? (
            <div className="relative h-full">
              <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={handleContentBlur}
                maxLength={2000}
                className="block w-full h-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder:opacity-40"
                data-lenis-prevent="true"
                placeholder="Write something..."
                style={{ color: note.textColor }}
              />
            </div>
          ) : (
            <div
              onClick={() => {
                if (note.isCompleted) return;
                setIsEditingContent(true);
                setTimeout(() => contentRef.current?.focus(), 50);
              }}
              className={`text-sm leading-relaxed ${!note.isCompleted ? 'cursor-text' : 'cursor-default'} whitespace-pre-wrap h-full ${
                note.isCompleted ? 'line-through' : ''
              } ${!content ? 'opacity-40' : ''}`}
            >
              {content || 'Click to write...'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-2 text-[10px] opacity-40 font-bold flex justify-between items-center">
          <span>edited {timeAgo()}</span>
          {isEditingContent ? (
            <span className="font-mono">{content.length}/2000</span>
          ) : (
            note.isCompleted && <span className="uppercase tracking-widest transition-opacity duration-200 group-hover:opacity-0">✓ Done</span>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

// ponytail: zero-dependency performance boost via native React.memo
// Prevents the entire board from re-rendering every 500ms when typing in a single note
export default React.memo(NoteCard, (prev, next) => {
  return prev.note === next.note && prev.rotation === next.rotation;
});
