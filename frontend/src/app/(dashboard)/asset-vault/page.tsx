"use client";

import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAssets } from '@/features/asset-vault/useAssets';
import AssetToolbar from '@/features/asset-vault/components/AssetToolbar';
import AssetCard from '@/features/asset-vault/components/AssetCard';
import UploadZone from '@/features/asset-vault/components/UploadZone';
import ConfirmModal from '@/components/ui/ConfirmModal';

gsap.registerPlugin(useGSAP);

export default function AssetVaultPage() {
  const { assets, loading, uploading, uploadAsset, removeAsset, removeAllAssets } = useAssets();
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  // Staggered entrance animation
  useGSAP(() => {
    if (!loading && assets.length > 0) {
      gsap.fromTo(
        '.asset-card',
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9 
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.5, 
          stagger: 0.1, 
          ease: 'back.out(1.5)',
          clearProps: 'all' // prevents transform issues later
        }
      );
    }
  }, [loading, assets.length]);

  const handleDelete = (id: string) => {
    if (assetToDelete) {
      removeAsset(assetToDelete);
      setAssetToDelete(null);
    }
  };

  // Handle global paste for images (e.g. screenshots)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await uploadAsset(file);
            break; // only upload one image from the paste event to prevent spam
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [uploadAsset]);

  return (
    <div className="w-full min-h-full pb-20 relative">
      <AssetToolbar 
        assetCount={assets.length} 
        onUpload={uploadAsset}
        isUploading={uploading}
        onDeleteAll={removeAllAssets}
      />

      <div className="w-full space-y-8">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-black dark:border-neutral-700 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Assets Grid */}
        {!loading && assets.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {assets.map((asset) => (
              <div key={asset._id} className="asset-card">
                <AssetCard 
                  asset={asset}
                  onDelete={(id) => setAssetToDelete(id)}
                />
              </div>
            ))}
          </section>
        )}

        {/* Empty State */}
        {!loading && assets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 dark:text-gray-400">
            <p className="font-black uppercase tracking-widest text-lg mb-2">Vault is Empty</p>
            <p className="font-bold text-sm">Drag and drop some files above to securely store them.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {assetToDelete && (
        <ConfirmModal
          title="Delete Asset"
          description="Are you sure you want to permanently delete this asset from the cloud? This action cannot be undone."
          confirmText="Delete Asset"
          onConfirm={() => handleDelete(assetToDelete)}
          onCancel={() => setAssetToDelete(null)}
        />
      )}
    </div>
  );
}
