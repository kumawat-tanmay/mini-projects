import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Asset } from './types';
import * as api from './api';

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Fetch
  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await api.fetchAssets();
      setAssets(fetched);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Upload
  const uploadAsset = useCallback(async (file: File) => {
    try {
      setUploading(true);
      const newAsset = await api.uploadAsset(file);
      setAssets((prev) => [newAsset, ...prev]);
      toast.success('Asset uploaded successfully!');
      return newAsset;
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload asset');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  // Delete
  const removeAsset = useCallback(async (id: string) => {
    // Optimistic
    setAssets((prev) => prev.filter((a) => a._id !== id));
    try {
      await api.deleteAsset(id);
      toast.success('Asset deleted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete asset');
      loadAssets(); // rollback
    }
  }, [loadAssets]);

  return {
    assets,
    loading,
    uploading,
    uploadAsset,
    removeAsset,
    refreshAssets: loadAssets,
  };
};
