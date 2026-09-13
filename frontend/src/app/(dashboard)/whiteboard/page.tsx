"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for Fabric.js browser canvas APIs
const FabricCanvas = dynamic(
  () => import('@/features/whiteboard/components/FabricCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-black border-4 border-black dark:border-white">
        <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin mb-4" />
        <span className="font-mono font-black uppercase tracking-widest text-xs text-black dark:text-white">
          Loading Brutalist Canvas...
        </span>
      </div>
    )
  }
);

export default function WhiteboardPage() {
  return (
    <div
      data-lenis-prevent
      className="w-full h-[calc(100vh-140px)] min-h-[500px] border-4 border-black dark:border-white bg-white dark:bg-black overflow-hidden relative shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ffffff]"
    >
      <FabricCanvas />
    </div>
  );
}
