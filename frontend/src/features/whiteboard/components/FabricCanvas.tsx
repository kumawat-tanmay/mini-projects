"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  Canvas,
  Rect,
  Circle,
  Line,
  Triangle,
  IText,
  PencilBrush,
  Shadow,
  Point,
  FabricObject,
  InteractiveFabricObject,
} from 'fabric';
import {
  MousePointer,
  Pencil,
  Square,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Minus,
  Type,
  StickyNote,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { fetchWhiteboard, updateWhiteboard, clearWhiteboard } from '../api';

type ToolType = 'select' | 'pencil' | 'rect' | 'circle' | 'triangle' | 'line' | 'text' | 'sticky';

const COLOR_PALETTE = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
];

const STROKE_WIDTHS = [2, 4, 8, 14];

export default function FabricCanvas() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);

  // State
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeFill, setActiveFill] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [saveState, setSaveState] = useState<'idle' | 'changes-pending' | 'saving' | 'saved' | 'error'>('idle');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [hasSelection, setHasSelection] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Undo / Redo history
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoRedoRef = useRef<boolean>(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Auto-save debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Track spacebar for panning
  const isSpacePressedRef = useRef(false);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update undo/redo availability
  const updateUndoRedoState = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Save current canvas state to history stack
  const pushHistory = useCallback(() => {
    if (!fabricRef.current || isUndoRedoRef.current || isInitialLoadRef.current) return;
    const json = JSON.stringify(fabricRef.current.toJSON());
    
    // Discard any redo states if we made a new action
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(json);
    
    // Cap history at 25 states
    if (newHistory.length > 25) {
      newHistory.shift();
    }
    
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  // Execute debounced cloud save
  const triggerAutoSave = useCallback(() => {
    if (isInitialLoadRef.current || !fabricRef.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveState('changes-pending');
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!fabricRef.current) return;
      try {
        setSaveState('saving');
        const json = fabricRef.current.toJSON();
        await updateWhiteboard(json);
        setSaveState('saved');
      } catch (err) {
        console.error('Failed to auto-save canvas:', err);
        setSaveState('error');
      }
    }, 1500);
  }, []);

  // Initialize Canvas
  useEffect(() => {
    let isMounted = true;
    if (!canvasElRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 600;

    const canvas = new Canvas(canvasElRef.current, {
      width,
      height,
      backgroundColor: resolvedTheme === 'dark' ? '#121212' : '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;

    // Configure selection style
    InteractiveFabricObject.ownDefaults.transparentCorners = false;
    InteractiveFabricObject.ownDefaults.cornerColor = '#000000';
    InteractiveFabricObject.ownDefaults.cornerStrokeColor = '#ffffff';
    InteractiveFabricObject.ownDefaults.borderColor = '#000000';
    InteractiveFabricObject.ownDefaults.cornerSize = 10;
    InteractiveFabricObject.ownDefaults.cornerStyle = 'rect';

    // Selection event listeners
    const handleSelectionCreated = () => setHasSelection(true);
    const handleSelectionCleared = () => setHasSelection(false);

    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);

    // Mutation listeners for history and auto-save
    const handleCanvasModified = () => {
      if (isUndoRedoRef.current) return;
      pushHistory();
      triggerAutoSave();
    };

    canvas.on('object:added', handleCanvasModified);
    canvas.on('object:modified', handleCanvasModified);
    canvas.on('object:removed', handleCanvasModified);
    canvas.on('path:created', handleCanvasModified);

    // Mouse wheel zoom
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      let zoom = canvas.getZoom();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom *= zoomFactor;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.2) zoom = 0.2;

      canvas.zoomToPoint(opt.viewportPoint, zoom);
      setZoomLevel(Math.round(zoom * 100));
    });

    // Panning with spacebar or middle click
    canvas.on('mouse:down', (opt) => {
      const isMiddleClick = 'button' in opt.e && (opt.e as MouseEvent).button === 1;
      if (isSpacePressedRef.current || isMiddleClick) {
        isPanningRef.current = true;
        canvas.selection = false;
        lastPanPosRef.current = { x: opt.viewportPoint.x, y: opt.viewportPoint.y };
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanningRef.current) {
        const deltaX = opt.viewportPoint.x - lastPanPosRef.current.x;
        const deltaY = opt.viewportPoint.y - lastPanPosRef.current.y;
        canvas.relativePan(new Point(deltaX, deltaY));
        lastPanPosRef.current = { x: opt.viewportPoint.x, y: opt.viewportPoint.y };
      }
    });

    canvas.on('mouse:up', () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        canvas.selection = activeTool === 'select';
      }
    });

    // Initial load from MongoDB
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const board = await fetchWhiteboard();
        
        if (!isMounted || !fabricRef.current) return;

        // Ensure canvasData is a valid Fabric export with an objects array (filters out legacy tldraw data)
        if (
          board &&
          board.canvasData &&
          typeof board.canvasData === 'object' &&
          Array.isArray(board.canvasData.objects) &&
          board.canvasData.objects.length > 0
        ) {
          isUndoRedoRef.current = true;
          await canvas.loadFromJSON(board.canvasData);
          if (isMounted) {
            canvas.requestRenderAll();
          }
          isUndoRedoRef.current = false;
        }

        if (isMounted) {
          // Initialize history stack
          const initialJson = JSON.stringify(canvas.toJSON());
          historyRef.current = [initialJson];
          historyIndexRef.current = 0;
          updateUndoRedoState();
        }
      } catch (err) {
        console.error('Failed to load initial whiteboard:', err);
      } finally {
        if (isMounted) {
          isInitialLoadRef.current = false;
          setIsLoading(false);
          setSaveState('idle');
        }
      }
    };

    loadInitialData();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && isMounted && fabricRef.current) {
          canvas.setDimensions({ width: newW, height: newH });
          canvas.requestRenderAll();
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Theme change background sync
  useEffect(() => {
    if (!fabricRef.current) return;
    const bgColor = resolvedTheme === 'dark' ? '#121212' : '#ffffff';
    fabricRef.current.backgroundColor = bgColor;
    fabricRef.current.requestRenderAll();
  }, [resolvedTheme]);

  // Spacebar and keyboard shortcut handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an editable text box
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const activeObj = fabricRef.current?.getActiveObject();
      if (activeObj && (activeObj as any).isEditing) return;

      if (e.code === 'Space' && !e.repeat) {
        isSpacePressedRef.current = true;
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = 'grab';
        }
      }

      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }

      // Undo (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        if (fabricRef.current) {
          fabricRef.current.defaultCursor = activeTool === 'pencil' ? 'crosshair' : 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTool]);

  // Sync active tool state with canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (activeTool === 'pencil') {
      canvas.isDrawingMode = true;
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new PencilBrush(canvas);
      }
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = activeColor;
      canvas.defaultCursor = 'crosshair';
    } else {
      canvas.isDrawingMode = false;
      canvas.defaultCursor = 'default';
    }
  }, [activeTool, activeColor, strokeWidth]);

  // Handle Tool Selection & Shape Addition
  const handleSelectTool = (tool: ToolType) => {
    setActiveTool(tool);
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (tool === 'select' || tool === 'pencil') {
      return;
    }

    // Center coordinates in current viewport
    const vpt = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    const centerX = (-vpt[4] + canvas.getWidth() / 2) / zoom;
    const centerY = (-vpt[5] + canvas.getHeight() / 2) / zoom;

    let shape: FabricObject | null = null;

    if (tool === 'rect') {
      shape = new Rect({
        left: centerX - 75,
        top: centerY - 50,
        width: 150,
        height: 100,
        fill: activeFill === 'transparent' ? 'transparent' : activeFill,
        stroke: activeColor,
        strokeWidth,
      });
    } else if (tool === 'circle') {
      shape = new Circle({
        left: centerX - 50,
        top: centerY - 50,
        radius: 50,
        fill: activeFill === 'transparent' ? 'transparent' : activeFill,
        stroke: activeColor,
        strokeWidth,
      });
    } else if (tool === 'triangle') {
      shape = new Triangle({
        left: centerX - 60,
        top: centerY - 50,
        width: 120,
        height: 100,
        fill: activeFill === 'transparent' ? 'transparent' : activeFill,
        stroke: activeColor,
        strokeWidth,
      });
    } else if (tool === 'line') {
      shape = new Line([centerX - 80, centerY, centerX + 80, centerY], {
        stroke: activeColor,
        strokeWidth,
      });
    } else if (tool === 'text') {
      shape = new IText('TYPE HERE', {
        left: centerX - 60,
        top: centerY - 20,
        fontFamily: 'monospace',
        fontSize: 24,
        fontWeight: '900',
        fill: activeColor,
      });
    } else if (tool === 'sticky') {
      shape = new Rect({
        left: centerX - 90,
        top: centerY - 90,
        width: 180,
        height: 180,
        fill: '#fef08a', // vibrant brutalist sticky yellow
        stroke: '#000000',
        strokeWidth: 3,
        shadow: new Shadow({ color: '#000000', blur: 0, offsetX: 6, offsetY: 6 }),
      });

      const stickyText = new IText('NOTE...', {
        left: centerX - 70,
        top: centerY - 70,
        fontFamily: 'monospace',
        fontSize: 16,
        fontWeight: '700',
        fill: '#000000',
      });

      canvas.add(shape);
      canvas.add(stickyText);
      canvas.setActiveObject(stickyText);
      canvas.requestRenderAll();
      setActiveTool('select');
      return;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.requestRenderAll();
      setActiveTool('select');
    }
  };

  // Delete selected objects
  const deleteSelected = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      canvas.discardActiveObject();
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.requestRenderAll();
      setHasSelection(false);
    }
  };

  // Duplicate selected objects
  const duplicateSelected = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    try {
      const cloned = await active.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
    } catch (err) {
      console.error('Failed to clone object:', err);
    }
  };

  // Undo
  const handleUndo = async () => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current <= 0) return;

    try {
      isUndoRedoRef.current = true;
      historyIndexRef.current -= 1;
      const json = JSON.parse(historyRef.current[historyIndexRef.current]);
      await canvas.loadFromJSON(json);
      canvas.requestRenderAll();
      updateUndoRedoState();
      triggerAutoSave();
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      isUndoRedoRef.current = false;
    }
  };

  // Redo
  const handleRedo = async () => {
    const canvas = fabricRef.current;
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

    try {
      isUndoRedoRef.current = true;
      historyIndexRef.current += 1;
      const json = JSON.parse(historyRef.current[historyIndexRef.current]);
      await canvas.loadFromJSON(json);
      canvas.requestRenderAll();
      updateUndoRedoState();
      triggerAutoSave();
    } catch (err) {
      console.error('Redo failed:', err);
    } finally {
      isUndoRedoRef.current = false;
    }
  };

  // Zoom controls
  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (type === 'reset') {
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      setZoomLevel(100);
      canvas.requestRenderAll();
      return;
    }

    let zoom = canvas.getZoom();
    zoom = type === 'in' ? zoom * 1.25 : zoom / 1.25;
    if (zoom > 5) zoom = 5;
    if (zoom < 0.2) zoom = 0.2;

    const center = new Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    canvas.zoomToPoint(center, zoom);
    setZoomLevel(Math.round(zoom * 100));
  };

  // Export PNG
  const handleExportPNG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  // Export SVG
  const handleExportSVG = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const svgData = canvas.toSVG();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Force Save Now
  const handleForceSave = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    try {
      setSaveState('saving');
      const json = canvas.toJSON();
      await updateWhiteboard(json);
      setSaveState('saved');
    } catch (err) {
      console.error('Manual save failed:', err);
      setSaveState('error');
    }
  };

  // Clear Canvas
  const handleClearCanvas = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    try {
      setSaveState('saving');
      canvas.clear();
      const bgColor = resolvedTheme === 'dark' ? '#121212' : '#ffffff';
      canvas.backgroundColor = bgColor;
      canvas.requestRenderAll();

      await clearWhiteboard();
      
      const emptyJson = JSON.stringify(canvas.toJSON());
      historyRef.current = [emptyJson];
      historyIndexRef.current = 0;
      updateUndoRedoState();
      
      setSaveState('saved');
      setIsConfirmingClear(false);
    } catch (err) {
      console.error('Clear canvas failed:', err);
      setSaveState('error');
    }
  };

  const getStatusBadge = () => {
    switch (saveState) {
      case 'changes-pending':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-black bg-amber-300 font-mono text-[11px] font-black uppercase text-black">
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
            Pending
          </div>
        );
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-black bg-cyan-300 font-mono text-[11px] font-black uppercase text-black">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-black bg-emerald-300 font-mono text-[11px] font-black uppercase text-black">
            <Check className="w-3 h-3 text-emerald-800" />
            Synced
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-black bg-rose-400 font-mono text-[11px] font-black uppercase text-black">
            <AlertTriangle className="w-3 h-3 text-red-900" />
            Save Error
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 border-2 border-black bg-neutral-200 dark:bg-neutral-800 font-mono text-[11px] font-black uppercase text-black dark:text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Ready
          </div>
        );
    }
  };

  return (
    <div
      data-lenis-prevent
      className="w-full h-full flex flex-col select-none overflow-hidden relative"
    >
      {/* Brutalist Top Control Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-black border-b-4 border-black dark:border-white z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-black dark:bg-white" />
            <h2 className="font-black tracking-wider uppercase text-sm text-black dark:text-white font-mono">
              BRUTALIST CANVAS
            </h2>
          </div>
          {getStatusBadge()}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 border-2 border-black dark:border-white transition-all ${
              canUndo
                ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]'
                : 'opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-900'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 border-2 border-black dark:border-white transition-all ${
              canRedo
                ? 'bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]'
                : 'opacity-40 cursor-not-allowed bg-neutral-100 dark:bg-neutral-900'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-0.5 h-6 bg-black dark:bg-white mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom('in')}
            title="Zoom In"
            className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-black px-1 min-w-[45px] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => handleZoom('out')}
            title="Zoom Out"
            className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('reset')}
            title="Reset Zoom & Pan"
            className="p-1.5 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="w-0.5 h-6 bg-black dark:bg-white mx-1" />

          {/* Save Now */}
          <button
            onClick={handleForceSave}
            title="Save to Cloud"
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-emerald-400 hover:bg-emerald-300 active:translate-x-0.5 active:translate-y-0.5 text-black font-black font-mono text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>

          {/* Export PNG */}
          <button
            onClick={handleExportPNG}
            title="Export PNG Image"
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 text-black dark:text-white font-black font-mono text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            <Download className="w-3.5 h-3.5" />
            PNG
          </button>

          {/* Export SVG */}
          <button
            onClick={handleExportSVG}
            title="Export SVG Vector"
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black dark:border-white bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:translate-x-0.5 active:translate-y-0.5 text-black dark:text-white font-black font-mono text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
          >
            <Download className="w-3.5 h-3.5" />
            SVG
          </button>

          {/* Clear Canvas */}
          {isConfirmingClear ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearCanvas}
                className="px-2.5 py-1.5 border-2 border-black bg-red-600 hover:bg-red-500 text-white font-black font-mono text-xs uppercase"
              >
                Confirm Clear
              </button>
              <button
                onClick={() => setIsConfirmingClear(false)}
                className="px-2 py-1.5 border-2 border-black bg-neutral-200 text-black font-mono text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClear(true)}
              title="Clear Canvas"
              className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 border-black dark:border-white bg-rose-200 hover:bg-rose-300 dark:bg-rose-950 dark:hover:bg-rose-900 active:translate-x-0.5 active:translate-y-0.5 text-black dark:text-white font-black font-mono text-xs uppercase shadow-[2px_2px_0px_#000000] dark:shadow-[2px_2px_0px_#ffffff]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 w-full relative flex overflow-hidden">
        {/* Floating Brutalist Toolbar */}
        <aside className="absolute top-4 left-4 z-30 flex flex-col gap-2 p-2 bg-white dark:bg-black border-4 border-black dark:border-white shadow-[4px_4px_0px_#000000] dark:shadow-[4px_4px_0px_#ffffff]">
          {/* Tool buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleSelectTool('select')}
              title="Select / Transform (V)"
              className={`p-2 border-2 border-black dark:border-white transition-all ${
                activeTool === 'select'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-black'
                  : 'bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <MousePointer className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectTool('pencil')}
              title="Freehand Pencil (P)"
              className={`p-2 border-2 border-black dark:border-white transition-all ${
                activeTool === 'pencil'
                  ? 'bg-black text-white dark:bg-white dark:text-black font-black'
                  : 'bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectTool('rect')}
              title="Rectangle"
              className="p-2 border-2 border-black dark:border-white bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectTool('circle')}
              title="Circle"
              className="p-2 border-2 border-black dark:border-white bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <CircleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectTool('triangle')}
              title="Triangle"
              className="p-2 border-2 border-black dark:border-white bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <TriangleIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectTool('line')}
              title="Straight Line"
              className="p-2 border-2 border-black dark:border-white bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectTool('text')}
              title="Text Box"
              className="p-2 border-2 border-black dark:border-white bg-white text-black dark:bg-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectTool('sticky')}
              title="Sticky Note Card"
              className="p-2 border-2 border-black dark:border-white bg-yellow-300 text-black hover:bg-yellow-200"
            >
              <StickyNote className="w-4 h-4" />
            </button>
          </div>

          <div className="h-0.5 bg-black dark:bg-white my-1" />

          {/* Stroke Width Selector */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] font-black uppercase text-slate-500 dark:text-neutral-400">
              Width
            </span>
            <div className="flex items-center gap-1">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`flex-1 py-1 border-2 border-black dark:border-white text-[10px] font-mono font-bold transition-all ${
                    strokeWidth === w
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-white dark:bg-black text-black dark:text-white'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          <div className="h-0.5 bg-black dark:bg-white my-1" />

          {/* Color Palette */}
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] font-black uppercase text-slate-500 dark:text-neutral-400">
              Color
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveColor(c.value)}
                  title={c.name}
                  style={{ backgroundColor: c.value }}
                  className={`w-6 h-6 border-2 border-black transition-transform ${
                    activeColor === c.value ? 'scale-110 ring-2 ring-blue-500' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Selection Actions */}
          {hasSelection && (
            <>
              <div className="h-0.5 bg-black dark:bg-white my-1" />
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] font-black uppercase text-slate-500 dark:text-neutral-400">
                  Selected
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={duplicateSelected}
                    title="Duplicate (Ctrl+D)"
                    className="flex-1 p-1.5 border-2 border-black dark:border-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-black dark:text-white flex items-center justify-center"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={deleteSelected}
                    title="Delete (Del)"
                    className="flex-1 p-1.5 border-2 border-black dark:border-white bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Shortcut Helper */}
          <div className="mt-1 pt-1 border-t border-neutral-300 dark:border-neutral-700">
            <p className="font-mono text-[8px] uppercase text-neutral-500 dark:text-neutral-400 leading-tight">
              Hold Space to Pan<br />
              Wheel to Zoom
            </p>
          </div>
        </aside>

        {/* Canvas DOM Element */}
        <div
          ref={containerRef}
          className="w-full h-full relative overflow-hidden bg-neutral-50 dark:bg-neutral-950"
        >
          {isLoading && (
            <div className="absolute inset-0 z-40 bg-white/90 dark:bg-black/90 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent animate-spin mb-4" />
              <span className="font-mono font-black uppercase tracking-widest text-xs text-black dark:text-white">
                INITIALIZING CANVAS...
              </span>
            </div>
          )}
          <canvas ref={canvasElRef} className="w-full h-full block" />
        </div>
      </div>
    </div>
  );
}
