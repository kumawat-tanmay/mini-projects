"use client";

import React, { useState, useEffect } from 'react';
import { Save, X, Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Prompt } from '../types';

interface PromptEditorProps {
  prompt: Prompt | null;
  onSave: (id: string, updates: Partial<Prompt>) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export default function PromptEditor({ prompt, onSave, onClose, onDelete }: PromptEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setContent(prompt.content);
    }
  }, [prompt]);

  if (!prompt) return null;

  const handleSave = () => {
    onSave(prompt._id, { title, content });
    toast.success('Prompt saved successfully!');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    toast.success('Prompt copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      {/* Blurred Backdrop */}
      <div 
        className="fixed inset-0 top-16 z-30 bg-white/20 dark:bg-black/20 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Editor Panel */}
      <div 
        className="fixed top-16 right-0 bottom-0 w-full sm:w-[40%] bg-white dark:bg-[#1a1a1a] border-l border-black dark:border-neutral-700 shadow-2xl z-40 flex flex-col transition-transform duration-300 transform translate-x-0"
      >
      {/* Editor Header */}
      <div className="flex justify-between items-center p-4 border-b border-black dark:border-neutral-700 bg-gray-100 dark:bg-black/50">
        <h2 className="font-black uppercase tracking-widest text-lg">Edit Prompt</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 border-2 border-black dark:border-neutral-700 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            title="Copy Prompt"
          >
            {isCopied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={2} />}
          </button>
          {prompt._id !== 'draft' && onDelete && (
            showDeleteConfirm ? (
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(prompt._id);
                }}
                className="px-3 py-1 bg-red-500 text-white font-black uppercase tracking-widest text-[10px] border-2 border-transparent hover:bg-red-600 transition-colors"
                title="Confirm Delete"
              >
                Sure?
              </button>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 border-2 border-black dark:border-neutral-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 hover:border-red-500 dark:hover:border-red-500 transition-colors text-red-500 hover:text-white"
                title="Delete Prompt"
              >
                <Trash2 size={18} strokeWidth={2} />
              </button>
            )
          )}
          <button
            onClick={onClose}
            className="p-2 border-2 border-black dark:border-neutral-700 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            title="Close Editor"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto" data-lenis-prevent="true">
        <div className="flex flex-col gap-2">
          <label className="font-black uppercase tracking-widest text-xs opacity-60">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-transparent border border-black dark:border-neutral-700 outline-none font-black text-lg focus:bg-black/5 dark:focus:bg-white/5 transition-colors"
            placeholder="Name your prompt..."
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <label className="font-black uppercase tracking-widest text-xs opacity-60">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 px-4 py-3 bg-transparent border border-black dark:border-neutral-700 outline-none font-mono text-sm leading-relaxed resize-none focus:bg-black/5 dark:focus:bg-white/5 transition-colors"
            placeholder="Write your AI prompt here..."
          />
        </div>
      </div>

      {/* Editor Footer / Save Button */}
      <div className="p-4 border-t border-black dark:border-neutral-700 bg-gray-100 dark:bg-black/50 flex flex-col gap-3">
        {prompt._id !== 'draft' && prompt.createdAt && (
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-black/40 dark:text-white/40 px-1">
            <span>Created: {new Date(prompt.createdAt).toLocaleString()}</span>
            {prompt.updatedAt && <span>Edited: {new Date(prompt.updatedAt).toLocaleString()}</span>}
          </div>
        )}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-[#ffeb3b] text-black border border-black font-black uppercase tracking-widest text-xl hover:bg-black hover:text-[#ffeb3b] transition-colors flex items-center justify-center gap-2"
          style={{ boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}
        >
          <Save size={24} strokeWidth={3} />
          SAVE PROMPT
        </button>
      </div>
    </div>
    </>
  );
}
