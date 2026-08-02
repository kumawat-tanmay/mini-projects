"use client";

import React from 'react';
import { Plus, Trash2, ArrowUpDown, Filter, Calendar } from 'lucide-react';
import type { SortOption, FilterOption } from '../types';

interface NotesToolbarProps {
  noteCount: number;
  maxNotes: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  filter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
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
  dateFilter,
  onDateFilterChange,
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
    <div className="sticky top-16 z-20 flex flex-wrap items-center gap-4 mb-8 p-4 bg-purple-50 dark:bg-purple-950 border-4 border-black dark:border-white transition-colors duration-300">
      {/* New Note Button */}
      <button
        onClick={onCreateNote}
        disabled={noteCount >= maxNotes}
        className="group relative disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 bg-black dark:bg-white translate-y-1 translate-x-1 group-hover:translate-y-0.5 group-hover:translate-x-0.5 transition-transform group-disabled:translate-y-1 group-disabled:translate-x-1" />
        <div className="relative bg-yellow-400 border-4 border-black dark:border-white px-5 py-2.5 flex items-center gap-2 font-black uppercase tracking-widest text-sm text-black transition-transform hover:-translate-y-0.5 hover:-translate-x-0.5 active:translate-y-0 active:translate-x-0">
          <Plus size={18} strokeWidth={3} />
          New Note
        </div>
      </button>

      {/* Note Count */}
      <span className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {noteCount}/{maxNotes}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date Filter */}
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => onDateFilterChange(e.target.value)}
          className="text-sm font-bold border-2 border-black dark:border-white bg-transparent text-black dark:text-white px-3 py-1.5 outline-none"
        />
        {dateFilter && (
          <button
            onClick={() => onDateFilterChange('')}
            className="text-xs font-black text-red-500 hover:text-red-700 uppercase"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <ArrowUpDown size={16} className="text-gray-500 dark:text-gray-400" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="text-sm font-bold border-2 border-black dark:border-white bg-transparent text-black dark:text-white px-3 py-1.5 outline-none cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-black">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Dropdown */}
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-gray-500 dark:text-gray-400" />
        <select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as FilterOption)}
          className="text-sm font-bold border-2 border-black dark:border-white bg-transparent text-black dark:text-white px-3 py-1.5 outline-none cursor-pointer"
        >
          {filterOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-black">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Delete All Button */}
      {noteCount > 0 && (
        <button
          onClick={onDeleteAll}
          className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-500 hover:text-white hover:bg-red-500 dark:hover:text-white transition-all px-3 py-1.5 border-2 border-red-500/30 hover:border-red-500"
        >
          <Trash2 size={14} strokeWidth={3} />
          Delete All
        </button>
      )}
    </div>
  );
}
