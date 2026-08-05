"use client";

import React, { useState } from 'react';
import { Database, Image as ImageIcon, ClipboardPaste, Trash2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useRef } from 'react';

interface AssetToolbarProps {
  assetCount: number;
  onUpload: (file: File) => Promise<any>;
  isUploading: boolean;
  onDeleteAll: () => Promise<void>;
}

export default function AssetToolbar({ assetCount, onUpload, isUploading, onDeleteAll }: AssetToolbarProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteAll = async () => {
    await onDeleteAll();
    setIsDeleteModalOpen(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await onUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 p-2 sm:p-4 bg-yellow-200 border-4 border-black transition-colors duration-300 text-black">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black text-yellow-400">
          <Database size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none mb-1">
            Asset Vault
          </h1>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest opacity-80">
              Secure Cloud Storage
            </span>
            <span className="text-xs font-black uppercase tracking-widest bg-black text-yellow-400 px-2 py-0.5 ml-2">
              {assetCount} / 20 Assets
            </span>
          </div>
        </div>
        
        {assetCount > 0 && (
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="ml-auto xl:ml-4 p-2 bg-white border-2 border-black hover:bg-red-500 hover:text-white transition-colors group cursor-pointer"
            title="Delete All Assets"
          >
            <Trash2 size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf"
        />

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="group relative px-3 sm:px-6 py-2.5 sm:py-3 bg-white text-black border-4 border-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
          style={{
            boxShadow: '4px 4px 0px rgba(0,0,0,1)',
          }}
        >
          {isUploading ? <ClipboardPaste size={18} className="animate-spin" /> : <ClipboardPaste size={18} strokeWidth={3} />}
          <span className="hidden sm:inline">Upload File</span>
        </button>
      </div>

      {isDeleteModalOpen && (
        <ConfirmModal
          title="Delete All Assets"
          description={
            <div className="space-y-2 text-lg">
              <p>Are you absolutely sure you want to permanently delete <strong>all {assetCount} assets</strong>?</p>
              <p className="text-red-600 font-bold">This action cannot be undone and will erase all data.</p>
            </div>
          }
          confirmText="Delete All"
          onConfirm={handleDeleteAll}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
