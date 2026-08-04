"use client";

import React, { useRef } from 'react';
import { Plus, Upload, Loader2, Trash2 } from 'lucide-react';

interface PromptToolbarProps {
  promptCount: number;
  onCreatePrompt: () => void;
  onUploadFile: (file: File) => Promise<void>;
  isUploading: boolean;
  onDeleteAll: () => void;
}

export default function PromptToolbar({
  promptCount,
  onCreatePrompt,
  onUploadFile,
  isUploading,
  onDeleteAll
}: PromptToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadFile(file);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="sticky top-16 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 bg-rose-50 border-4 border-black transition-colors duration-300 text-black">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black">
          Prompt Store
        </h1>
        <div className="px-3 py-1 bg-black text-white font-black text-sm uppercase tracking-widest border-2 border-black hidden sm:block">
          {promptCount} / 30 Prompts
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.md,.pdf"
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="group relative px-6 py-3 bg-white text-black border-4 border-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          style={{
            boxShadow: '4px 4px 0px rgba(0,0,0,1)',
          }}
        >
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} strokeWidth={3} />}
          <div className="flex flex-col items-start leading-none gap-1">
            <span>Upload File</span>
            <span className="text-[9px] opacity-70 tracking-widest">.TXT, .MD, .PDF</span>
          </div>
        </button>

        <button
          onClick={onCreatePrompt}
          className="group relative px-6 py-3 bg-[#ffeb3b] text-black border-4 border-black font-black uppercase tracking-widest hover:bg-black hover:text-[#ffeb3b] transition-colors flex items-center gap-2"
          style={{
            boxShadow: '4px 4px 0px rgba(0,0,0,1)',
          }}
        >
          <Plus size={18} strokeWidth={3} />
          <span>New Prompt</span>
        </button>

        {promptCount > 0 && (
          <button
            onClick={onDeleteAll}
            className="group relative px-6 py-3 bg-red-500 text-white border-4 border-black font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center gap-2"
            style={{
              boxShadow: '4px 4px 0px rgba(0,0,0,1)',
            }}
          >
            <Trash2 size={20} strokeWidth={3} />
            Delete All
          </button>
        )}
      </div>
    </div>
  );
}
