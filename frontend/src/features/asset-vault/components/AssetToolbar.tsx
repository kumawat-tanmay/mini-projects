"use client";

import React, { useState } from 'react';
import { Database, Image as ImageIcon, ClipboardPaste, Trash2 } from 'lucide-react';
import UploadZone from './UploadZone';
import ConfirmModal from '@/components/ui/ConfirmModal';

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

  return (
    <div className="sticky top-16 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 bg-yellow-200 border-4 border-black transition-colors duration-300 text-black">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black text-yellow-400">
          <Database size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tighter leading-none mb-1">
            Asset Vault
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">
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
            className="ml-auto sm:ml-4 p-2 bg-white border-2 border-black hover:bg-red-500 hover:text-white transition-colors group cursor-pointer"
            title="Delete All Assets"
          >
            <Trash2 size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="hidden lg:flex items-center gap-4 bg-white/80 border-4 border-black/40 px-6 py-4">
          <ClipboardPaste size={32} strokeWidth={2.5} />
          <div className="flex flex-col leading-tight">
            <span className="font-bold uppercase tracking-wider text-lg text-black">
              Pro Tip: Paste Anywhere
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-black/80">
              Press Ctrl+V to instantly upload screenshots
            </span>
          </div>
        </div>
        
        <UploadZone onUpload={onUpload} isUploading={isUploading} />
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
