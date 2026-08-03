"use client";

import React, { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useNotes } from '@/features/sticky-notes/useNotes';
import NotesToolbar from '@/features/sticky-notes/components/NotesToolbar';
import NotesBoard from '@/features/sticky-notes/components/NotesBoard';
import EmptyState from '@/features/sticky-notes/components/EmptyState';
import ConfirmModal from '@/components/ui/ConfirmModal';

gsap.registerPlugin(useGSAP);

const MAX_NOTES = 30;

export default function StickyNotesPage() {
  const {
    notes,
    loading,
    sort,
    setSort,
    filter,
    setFilter,
    addNote,
    editNote,
    togglePin,
    toggleComplete,
    changeColor,
    changeTextColor,
    removeNote,
    removeAll,
  } = useNotes();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleCreateNote = async () => {
    await addNote();
  };

  const handleDeleteAll = async () => {
    await removeAll();
    setShowDeleteModal(false);
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <NotesToolbar
        noteCount={notes.length}
        maxNotes={MAX_NOTES}
        sort={sort}
        onSortChange={setSort}
        filter={filter}
        onFilterChange={setFilter}
        onCreateNote={handleCreateNote}
        onDeleteAll={() => setShowDeleteModal(true)}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-black dark:border-neutral-700 border-t-transparent animate-spin" />
        </div>
      )}

      {/* Notes Board or Empty State */}
      {!loading && notes.length === 0 && (
        <EmptyState onCreateNote={handleCreateNote} />
      )}

      {!loading && notes.length > 0 && (
        <NotesBoard
          notes={notes}
          onEdit={editNote}
          onTogglePin={togglePin}
          onToggleComplete={toggleComplete}
          onChangeColor={changeColor}
          onChangeTextColor={changeTextColor}
          onDelete={removeNote}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          title="Delete All Notes"
          description={
            <>
              This will permanently delete <span className="text-red-500 font-black">{notes.length}</span> note{notes.length !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </>
          }
          confirmText="Delete All"
          onConfirm={handleDeleteAll}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
