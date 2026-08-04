"use client";

import React from 'react';
import { Database, Image as ImageIcon, ClipboardPaste } from 'lucide-react';
import UploadZone from './UploadZone';

interface AssetToolbarProps {
  assetCount: number;
  onUpload: (file: File) => Promise<any>;
  isUploading: boolean;
}

export default function AssetToolbar({ assetCount, onUpload, isUploading }: AssetToolbarProps) {
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
    </div>
  );
}
