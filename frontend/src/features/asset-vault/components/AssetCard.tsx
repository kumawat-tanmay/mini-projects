import React, { useState } from 'react';
import { Copy, Trash2, FileText, Download, Check, Link, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Asset } from '../types';

interface AssetCardProps {
  asset: Asset;
  onDelete: (id: string) => void;
}

export default function AssetCard({ asset, onDelete }: AssetCardProps) {
  const [isCopiedUrl, setIsCopiedUrl] = useState(false);
  const [isCopiedImage, setIsCopiedImage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(asset.format.toLowerCase());

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(asset.url);
    setIsCopiedUrl(true);
    setTimeout(() => setIsCopiedUrl(false), 2000);
  };

  const handleCopyImage = async () => {
    try {
      // Need to fetch image as blob to copy to clipboard
      const response = await fetch(asset.url);
      const blob = await response.blob();
      
      let clipboardBlob = blob;
      
      // The Clipboard API strictly requires image/png in most browsers.
      // If it's a JPEG or WebP, we must convert it to a PNG blob via canvas.
      if (blob.type !== 'image/png') {
        clipboardBlob = await new Promise<Blob>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context failed'));
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((b) => {
              if (b) resolve(b);
              else reject(new Error('Blob conversion failed'));
            }, 'image/png');
          };
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = window.URL.createObjectURL(blob);
        });
      }
      
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': clipboardBlob
        })
      ]);
      
      setIsCopiedImage(true);
      toast.success("Image copied to clipboard!");
      setTimeout(() => setIsCopiedImage(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error("Failed to copy image. It might not be a supported format for clipboard.");
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setIsDownloading(true);
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = asset.name || `download.${asset.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback to opening in new tab
      window.open(asset.url, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpen = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // For images, we can just open the URL directly since they don't have attachment headers
    if (isImage) {
      window.open(asset.url, '_blank');
      return;
    }

    // For PDFs (raw files), Cloudinary forces Content-Disposition: attachment
    // To view it inline, we fetch it and open a local blob URL with the correct PDF MIME type
    try {
      setIsOpening(true);
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      window.open(blobUrl, '_blank');
      
      // We can't immediately revoke the URL because the new tab needs time to load it
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error("Open failed:", err);
      window.open(asset.url, '_blank'); // fallback
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-neutral-700 flex flex-col hover:-translate-y-1 transition-transform" style={{ boxShadow: '6px 6px 0px rgba(0,0,0,1)' }}>
      {/* Preview Area */}
      <div className="relative aspect-square w-full border-b-4 border-black dark:border-neutral-700 bg-gray-100 dark:bg-black overflow-hidden flex items-center justify-center">
        {isImage ? (
          <img 
            src={asset.url} 
            alt={asset.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-red-500">
            <FileText size={64} strokeWidth={1.5} />
            <span className="font-black uppercase tracking-widest text-xs bg-red-500 text-white px-2 py-1">PDF</span>
          </div>
        )}

        {/* Hover Overlay Buttons */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          {isImage ? (
            <>
              <button
                onClick={handleCopyUrl}
                className="p-3 bg-white text-black border-2 border-black hover:bg-yellow-400 transition-colors tooltip"
                title="Copy URL"
              >
                {isCopiedUrl ? <Check size={24} strokeWidth={3} /> : <Link size={24} strokeWidth={2.5} />}
              </button>
              <button
                onClick={handleCopyImage}
                className="p-3 bg-white text-black border-2 border-black hover:bg-yellow-400 transition-colors tooltip"
                title="Copy Image to Clipboard"
              >
                {isCopiedImage ? <Check size={24} strokeWidth={3} /> : <ImageIcon size={24} strokeWidth={2.5} />}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleOpen}
                disabled={isOpening}
                className="p-3 bg-white text-black border-2 border-black hover:bg-blue-400 transition-colors tooltip disabled:opacity-50"
                title="Open PDF"
              >
                <ExternalLink size={24} strokeWidth={2.5} className={isOpening ? "animate-pulse" : ""} />
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-3 bg-white text-black border-2 border-black hover:bg-green-400 transition-colors tooltip disabled:opacity-50"
                title="Download PDF"
              >
                <Download size={24} strokeWidth={2.5} className={isDownloading ? "animate-bounce" : ""} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Area */}
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate text-black dark:text-white" title={asset.name}>
            {asset.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mt-1">
            {(asset.size / 1024).toFixed(1)} KB • {asset.format.toUpperCase()}
          </p>
        </div>
        <button
          onClick={() => onDelete(asset._id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-2 border-transparent hover:border-red-500 flex-shrink-0"
          title="Delete Asset"
        >
          <Trash2 size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
