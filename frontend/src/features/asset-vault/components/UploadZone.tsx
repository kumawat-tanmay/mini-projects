"use client";

import React, { useCallback, useState } from 'react';
import { Upload, FileType, Image as ImageIcon, Loader2 } from 'lucide-react';

interface UploadZoneProps {
  onUpload: (file: File) => Promise<any>;
  isUploading: boolean;
}

export default function UploadZone({ onUpload, isUploading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        await onUpload(e.dataTransfer.files[0]);
      }
    },
    [onUpload]
  );

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await onUpload(e.target.files[0]);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`relative py-10 px-16 flex items-center justify-center gap-6 border-4 border-dashed transition-all duration-300 min-w-[450px] ${
        isDragging
          ? 'border-black bg-yellow-300 dark:bg-yellow-500 text-black'
          : 'border-black bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-900 text-black dark:text-white'
      }`}
    >
      <input
        type="file"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        accept="image/*,.pdf"
        disabled={isUploading}
      />
      
      {isUploading ? (
        <>
          <Loader2 size={28} strokeWidth={2.5} className="animate-spin" />
          <span className="font-black uppercase tracking-wider text-sm">Uploading...</span>
        </>
      ) : (
        <>
          <div className="flex gap-2 opacity-80 border-r-2 border-black/20 dark:border-white/20 pr-6">
            <ImageIcon size={32} strokeWidth={2.5} />
            <FileType size={32} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="font-bold uppercase tracking-wider text-lg">
              Drag & Drop to Upload
            </span>
            <span className="text-xs font-bold uppercase tracking-widest opacity-60">
              Less than 10 MB file
            </span>
          </div>
        </>
      )}
    </div>
  );
}
