import { apiFetch } from '@/utils/api';
import type { StickyNote, NoteStats, SortOption, FilterOption } from './types';

export const fetchNotes = async (
  sort: SortOption = 'newest',
  filter: FilterOption = 'all',
  date?: string
): Promise<StickyNote[]> => {
  const params = new URLSearchParams({ sort, filter });
  if (date) params.append('date', date);
  const data = await apiFetch(`/sticky-notes?${params.toString()}`);
  return data.notes;
};

export const createNote = async (
  noteData: Partial<Pick<StickyNote, 'title' | 'content' | 'bgColor' | 'textColor'>>
): Promise<StickyNote> => {
  const data = await apiFetch('/sticky-notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
  return data.note;
};

export const updateNote = async (
  id: string,
  updates: Partial<Pick<StickyNote, 'title' | 'content' | 'bgColor' | 'textColor' | 'isPinned' | 'isCompleted' | 'position'>>
): Promise<StickyNote> => {
  const data = await apiFetch(`/sticky-notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.note;
};

export const deleteNote = async (id: string): Promise<void> => {
  await apiFetch(`/sticky-notes/${id}`, { method: 'DELETE' });
};

export const deleteAllNotes = async (): Promise<{ deletedCount: number }> => {
  const data = await apiFetch('/sticky-notes/all', { method: 'DELETE' });
  return data;
};

export const reorderNotes = async (orderedIds: string[]): Promise<void> => {
  await apiFetch('/sticky-notes/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  });
};

export const fetchNoteStats = async (): Promise<NoteStats> => {
  return await apiFetch('/sticky-notes/stats');
};
