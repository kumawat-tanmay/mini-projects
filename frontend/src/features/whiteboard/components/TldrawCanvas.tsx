import React, { useEffect, useState, useRef } from 'react';
import { Tldraw, Editor, loadSnapshot, getSnapshot } from 'tldraw';
import { useTheme } from 'next-themes';
import { fetchWhiteboard, updateWhiteboard } from '../api';
import 'tldraw/tldraw.css';

export default function TldrawCanvas() {
  const { resolvedTheme } = useTheme();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'changes-pending' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Load initial state on mount
  useEffect(() => {
    if (!editor) return;

    const loadInitialData = async () => {
      try {
        const board = await fetchWhiteboard();
        if (board && board.canvasData && Object.keys(board.canvasData).length > 0) {
          loadSnapshot(editor.store, board.canvasData);
        }
      } catch (err) {
        console.error('Failed to load whiteboard:', err);
      } finally {
        isInitialLoadRef.current = false;
        setSaveState('idle');
      }
    };

    loadInitialData();
  }, [editor]);

  // Debounced auto-save listener
  useEffect(() => {
    if (!editor) return;

    const cleanup = editor.store.listen((event) => {
      // Ignore initial loads or remote events if we want, but local changes are key.
      // tldraw's store.listen fires on any update.
      if (isInitialLoadRef.current) return;

      // Avoid saving on simple selection changes
      if (event.source === 'user') {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        setSaveState('changes-pending');

        saveTimeoutRef.current = setTimeout(async () => {
          try {
            setSaveState('saving');
            const snapshot = getSnapshot(editor.store);
            await updateWhiteboard(snapshot);
            setSaveState('saved');
          } catch (err) {
            console.error('Failed to auto-save whiteboard:', err);
            setSaveState('error');
          }
        }, 2000);
      }
    });

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      cleanup();
    };
  }, [editor]);

  const handleMount = (editorInstance: Editor) => {
    setEditor(editorInstance);
  };

  // Sync editor theme with application theme dynamically
  useEffect(() => {
    if (!editor) return;
    editor.user.updateUserPreferences({
      colorScheme: resolvedTheme === 'dark' ? 'dark' : 'light',
    });
  }, [editor, resolvedTheme]);

  const getStatusText = () => {
    switch (saveState) {
      case 'changes-pending': return 'Changes pending...';
      case 'saving': return 'Auto-saving to cloud...';
      case 'saved': return 'All changes saved';
      case 'error': return 'Failed to save!';
      default: return 'Cloud synced';
    }
  };

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Editor Header Bar with Save Status */}
      <div className="flex items-center justify-between px-6 py-3 border-b-4 border-black bg-neutral-100 dark:bg-neutral-800 shrink-0 select-none">
        <h3 className="font-black uppercase tracking-widest text-xs text-black dark:text-white">
          Infinite Canvas
        </h3>
        
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full border border-black ${
            saveState === 'saved' || saveState === 'idle' ? 'bg-emerald-400' :
            saveState === 'changes-pending' ? 'bg-yellow-400' :
            saveState === 'saving' ? 'bg-blue-400 animate-pulse' : 'bg-red-400'
          }`} />
          <span className="font-mono text-[10px] font-black uppercase text-slate-600 dark:text-neutral-300">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Tldraw Workspace */}
      <div className="flex-1 w-full relative">
        <Tldraw
          onMount={handleMount}
          colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    </div>
  );
}
