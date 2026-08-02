import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { StickyNote, SortOption, FilterOption } from './types';
import * as api from './api';

export function useNotes() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('newest');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Fetch notes from server
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await api.fetchNotes(sort, filter, dateFilter || undefined);
      setNotes(fetched);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [sort, filter, dateFilter]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Create
  const addNote = useCallback(async (bgColor?: string) => {
    try {
      const note = await api.createNote({ bgColor: bgColor || '#FACC15' });
      setNotes((prev) => [note, ...prev]);
      toast.success('Note created!');
      return note;
    } catch (err: any) {
      toast.error(err.message || 'Failed to create note');
      return null;
    }
  }, []);

  // Update (optimistic)
  const editNote = useCallback(async (id: string, updates: Partial<StickyNote>) => {
    let previousNote: StickyNote | undefined;
    
    // Optimistic update
    setNotes((prev) => {
      previousNote = prev.find((n) => n._id === id);
      return prev.map((n) => (n._id === id ? { ...n, ...updates } : n));
    });
    
    try {
      await api.updateNote(id, updates);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update note');
      // ponytail: local offline-resilient rollback
      if (previousNote) {
        setNotes((prev) => prev.map((n) => (n._id === id ? previousNote! : n)));
      }
      throw err;
    }
  }, []);

  // Toggle pin
  const togglePin = useCallback(async (id: string) => {
    const note = notes.find((n) => n._id === id);
    if (!note) return;
    await editNote(id, { isPinned: !note.isPinned });
  }, [notes, editNote]);

  // Toggle complete
  const toggleComplete = useCallback(async (id: string) => {
    const note = notes.find((n) => n._id === id);
    if (!note) return;
    await editNote(id, { isCompleted: !note.isCompleted });
  }, [notes, editNote]);

  // Change bg color
  const changeColor = useCallback(async (id: string, bgColor: string) => {
    await editNote(id, { bgColor });
  }, [editNote]);

  // Change text color
  const changeTextColor = useCallback(async (id: string, textColor: string) => {
    await editNote(id, { textColor });
  }, [editNote]);

  // Delete single
  const removeNote = useCallback(async (id: string) => {
    let previousNote: StickyNote | undefined;
    let previousIndex = -1;
    
    setNotes((prev) => {
      previousIndex = prev.findIndex((n) => n._id === id);
      if (previousIndex !== -1) previousNote = prev[previousIndex];
      return prev.filter((n) => n._id !== id);
    });
    
    try {
      await api.deleteNote(id);
      toast.success('Note deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete note');
      // ponytail: local offline-resilient rollback
      if (previousNote && previousIndex !== -1) {
        setNotes((prev) => {
          const arr = [...prev];
          arr.splice(previousIndex, 0, previousNote!);
          return arr;
        });
      }
      throw err;
    }
  }, []);

  // Delete all
  const removeAll = useCallback(async () => {
    const prevNotes = [...notes];
    setNotes([]);
    try {
      const result = await api.deleteAllNotes();
      toast.success(`${result.deletedCount} note(s) deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete notes');
      setNotes(prevNotes); // rollback
    }
  }, [notes]);

  // Reorder
  const reorder = useCallback(async (reorderedNotes: StickyNote[]) => {
    setNotes(reorderedNotes);
    try {
      await api.reorderNotes(reorderedNotes.map((n) => n._id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to reorder notes');
      loadNotes(); // rollback
    }
  }, [loadNotes]);

  return {
    notes,
    loading,
    sort,
    setSort,
    filter,
    setFilter,
    dateFilter,
    setDateFilter,
    addNote,
    editNote,
    togglePin,
    toggleComplete,
    changeColor,
    changeTextColor,
    removeNote,
    removeAll,
    reorder,
    loadNotes,
  };
}
