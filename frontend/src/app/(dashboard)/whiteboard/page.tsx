"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled is REQUIRED for tldraw due to heavy browser API usage
const TldrawCanvas = dynamic(
  () => import('@/features/whiteboard/components/TldrawCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-neutral-900 border-4 border-black">
        <div className="w-12 h-12 border-4 border-black dark:border-neutral-700 border-t-transparent animate-spin mb-4" />
        <span className="font-black uppercase tracking-widest text-xs text-black dark:text-white">Loading Workspace...</span>
      </div>
    )
  }
);

export default function WhiteboardPage() {
  return (
    <div className="w-full h-[calc(100vh-140px)] border-4 border-black bg-white dark:bg-neutral-900 overflow-hidden relative shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff]">
      <TldrawCanvas />
    </div>
  );
}
