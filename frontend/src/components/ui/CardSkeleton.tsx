import React from 'react';
import { Skeleton } from './Skeleton';

export function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full mt-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col bg-white dark:bg-neutral-900 border-4 border-black dark:border-neutral-700 p-5 min-h-[220px]">
          <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-6 w-6" />
          </div>
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-6 pt-4 flex items-center justify-between border-t-2 border-slate-100 dark:border-neutral-800">
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
