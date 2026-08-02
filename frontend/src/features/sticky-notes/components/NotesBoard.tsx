"use client";

import React, { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { StickyNote } from '../types';
import NoteCard from './NoteCard';

gsap.registerPlugin(useGSAP);

interface NotesBoardProps {
  notes: StickyNote[];
  onEdit: (id: string, updates: Partial<StickyNote>) => void;
  onTogglePin: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onChangeTextColor: (id: string, color: string) => void;
  onDelete: (id: string) => void;
}

export default function NotesBoard({
  notes,
  onEdit,
  onTogglePin,
  onToggleComplete,
  onChangeColor,
  onChangeTextColor,
  onDelete,
}: NotesBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Keep rotations at 0 for straight notes
  const rotations = useMemo(() => {
    const map: Record<string, number> = {};
    notes.forEach((note) => {
      map[note._id] = 0;
    });
    return map;
  }, [notes.map((n) => n._id).join(',')]);

  // GSAP stagger animation on mount
  useGSAP(() => {
    if (boardRef.current && notes.length > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      gsap.from('.note-card', {
        scale: 0,
        opacity: 0,
        rotation: (i) => (Math.random() - 0.5) * 20,
        duration: 0.5,
        stagger: 0.06,
        ease: 'elastic.out(1, 0.75)',
        clearProps: 'scale,opacity',
      });
    }
  }, { dependencies: [notes.length], scope: boardRef });

  return (
    <div
      ref={boardRef}
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      {notes.map((note) => (
        <NoteCard
          key={note._id}
          note={note}
          rotation={rotations[note._id] || 0}
          onEdit={onEdit}
          onTogglePin={onTogglePin}
          onToggleComplete={onToggleComplete}
          onChangeColor={onChangeColor}
          onChangeTextColor={onChangeTextColor}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
