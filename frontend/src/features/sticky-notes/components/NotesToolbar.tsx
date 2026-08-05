"use client";

import React from 'react';
import { Plus, Trash2, ArrowUpDown, Filter } from 'lucide-react';
import type { SortOption, FilterOption } from '../types';

interface NotesToolbarProps {
  noteCount: number;
  maxNotes: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  filter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onCreateNote: () => void;
  onDeleteAll: () => void;
}

export default function NotesToolbar({
  noteCount,
  maxNotes,
  sort,
  onSortChange,
  filter,
  onFilterChange,
  onCreateNote,
  onDeleteAll,
}: NotesToolbarProps) {
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'color', label: 'By Color' },
    { value: 'completed-last', label: 'Completed Last' },
  ];

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pinned', label: 'Pinned' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Done' },
  ];

  return (
    <div className="sticky top-16 z-20 flex flex-wrap items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-8 p-2 sm:p-4 bg-emerald-50 border-4 border-black transition-colors duration-300">
      {/* New Note Button */}
      <button
        onClick={onCreateNote}
        disabled={noteCount >= maxNotes}
        className="group relative disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 bg-black translate-y-1 translate-x-1 group-hover:translate-y-0.5 group-hover:translate-x-0.5 transition-transform group-disabled:translate-y-1 group-disabled:translate-x-1" />
        <div className="relative bg-yellow-400 border-4 border-black px-3 sm:px-5 py-2 sm:py-2.5 flex items-center gap-2 font-black uppercase tracking-widest text-xs sm:text-sm text-black transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0">
          <Plus size={18} strokeWidth={3} />
          <span className="hidden sm:inline">New Note</span>
        </div>
      </button>

      {/* Note Count */}
      <span className="hidden sm:inline text-sm font-black uppercase tracking-widest text-black">
        {noteCount}/{maxNotes}
      </span>

      {/* Spacer */}
      <div className="hidden sm:block flex-1" />

      {/* Sort Dropdown */}
      <div className="flex items-center gap-1 sm:gap-2">
        <ArrowUpDown size={14} className="hidden sm:block text-black" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="text-xs sm:text-sm font-bold border-2 border-black bg-transparent text-black px-2 py-1 sm:px-3 sm:py-1.5 outline-none cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-black">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Dropdown */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Filter size={14} className="hidden sm:block text-black" />
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as FilterOption)}
          className="text-xs sm:text-sm font-bold border-2 border-black bg-transparent text-black px-2 py-1 sm:px-3 sm:py-1.5 outline-none cursor-pointer"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white text-black">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Delete All Button */}
      {noteCount > 0 && (
        <button
          onClick={onDeleteAll}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black bg-red-500 hover:bg-red-600 transition-colors px-3 py-1.5 border-2 border-black"
        >
          <Trash2 size={14} strokeWidth={3} />
          <span className="hidden sm:inline">Delete All</span>
        </button>
      )}
    </div>
  );
}
