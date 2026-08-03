import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Prompt } from './types';
import * as api from './api';

export const usePrompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch prompts
  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await api.fetchPrompts();
      setPrompts(fetched);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Create
  const createPrompt = useCallback(async (data: { title: string; content: string }) => {
    try {
      const newPrompt = await api.createPrompt(data);
      setPrompts((prev) => [newPrompt, ...prev]);
      return newPrompt;
    } catch (err: any) {
      toast.error(err.message || 'Failed to save prompt');
      return null;
    }
  }, []);

  // Update
  const editPrompt = useCallback(async (id: string, updates: Partial<Prompt>) => {
    // Optimistic UI update
    setPrompts((prev) => prev.map((p) => (p._id === id ? { ...p, ...updates } : p)));
    try {
      await api.updatePrompt(id, updates);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update prompt');
      loadPrompts(); // rollback on failure
    }
  }, [loadPrompts]);

  // Delete
  const removePrompt = useCallback(async (id: string) => {
    // Optimistic UI update
    setPrompts((prev) => prev.filter((p) => p._id !== id));
    try {
      await api.deletePrompt(id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete prompt');
      loadPrompts(); // rollback
    }
  }, [loadPrompts]);

  // Delete All
  const removeAllPrompts = useCallback(async () => {
    try {
      await api.deleteAllPrompts();
      setPrompts([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete all prompts');
      loadPrompts();
    }
  }, [loadPrompts]);

  // Upload & Extract
  const uploadFile = useCallback(async (file: File) => {
    try {
      setLoading(true);
      const newPrompt = await api.extractTextFromFile(file);
      toast.success('File extracted! Review and save your prompt.');
      return newPrompt;
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract file');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    prompts,
    loading,
    createPrompt,
    editPrompt,
    removePrompt,
    removeAllPrompts,
    uploadFile,
    refreshPrompts: loadPrompts,
  };
};
