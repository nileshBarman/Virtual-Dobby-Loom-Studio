import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  PaintBucket,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Upload,
  Layers,
  Palette,
  Eye,
  Play,
  Maximize2
} from 'lucide-react';
import { DobbyDesign, GridMatrix, YarnMaterial } from '../types';
import {
  cloneMatrix,
  createMatrix,
  floodFill,
  invertMatrix,
  mirrorHorizontal,
  mirrorVertical,
  rotateMatrix90,
  generateLoomDraft
} from '../weave-engine';
import { MotifImporter } from './MotifImporter';
import { TEXTILE_COLOR_PALETTES } from '../data/defaultDesigns';

interface DobbyStudioProps {
  design: DobbyDesign;
  onChange: (updated: DobbyDesign) => void;
  onSimulate: () => void;
  onOpenStructure: () => void;
}

export const DobbyStudio: React.FC<DobbyStudioProps> = ({
  design,
  onChange,
  onSimulate,
  onOpenStructure,
}) => {
  // Tools: 'pen' | 'eraser' | 'fill' | 'zari'
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | 'fill' | 'zari'>('pen');
  const [zoom, setZoom] = useState<number>(1.0); // 0.5 to 8.0
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [pixelPerfect, setPixelPerfect] = useState<boolean>(false);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(true);
  const [showImporter, setShowImporter] = useState<boolean>(false);

  // Undo / Redo history
  const [history, setHistory] = useState<GridMatrix[]>([cloneMatrix(design.matrix)]);
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  // Clipboard for copy / paste
  const [clipboard, setClipboard] = useState<GridMatrix | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Mouse interaction state for drawing
  const isMouseDownRef = useRef<boolean>(false);
  const lastDrawnCellRef = useRef<{ r: number; c: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const rows = design.height;
  const cols = design.width;

  // Derive shafts needed in real-time
  const draftResult = generateLoomDraft(design.matrix, design.numShafts, design.draftingMethod);

  // Push new matrix to history
  const pushHistory = useCallback(
    (newMatrix: GridMatrix) => {
      const trimmed = history.slice(0, historyIdx + 1);
      trimmed.push(cloneMatrix(newMatrix));
      if (trimmed.length > 30) trimmed.shift();
      setHistory(trimmed);
      setHistoryIdx(trimmed.length - 1);
      onChange({
        ...design,
        matrix: newMatrix,
        updatedAt: new Date().toISOString(),
      });
    },
    [history, historyIdx, design, onChange]
  );

  const undo = () => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      onChange({
        ...design,
        matrix: cloneMatrix(history[newIdx]),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const redo = () => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      onChange({
        ...design,
        matrix: cloneMatrix(history[newIdx]),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (e.key === 'e' || e.key === 'Delete') {
        setActiveTool('eraser');
      } else if (e.key === 'p' || e.key === 'b') {
        setActiveTool('pen');
      } else if (e.key === 'f' || e.key === 'g') {
        setActiveTool('fill');
      } else if (e.key === 'z') {
        setActiveTool('zari');
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom(z => Math.min(8.0, z * 1.25));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom(z => Math.max(0.4, z / 1.25));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate cell size based on container and zoom
  const baseCellSize = 20 * zoom;

  // Redraw Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = cols * baseCellSize;
    const canvasHeight = rows * baseCellSize;

    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Draw Grid Cells
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = design.matrix[r][c];
        const x = c * baseCellSize;
        const y = r * baseCellSize;

        if (val === 2) {
          ctx.fillStyle = design.zariColor; // Zari
        } else if (val === 1) {
          ctx.fillStyle = design.warpColor; // Warp up
        } else {
          ctx.fillStyle = '#161922'; // Weft (graph empty cell)
        }
        ctx.fillRect(x, y, baseCellSize, baseCellSize);

        // Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, baseCellSize, baseCellSize);

        // Major 4x4 / 8x8 textile graph paper grid lines (thicker lines)
        if (c % 4 === 0 && c > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + baseCellSize);
          ctx.stroke();
        }
        if (r % 4 === 0 && r > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + baseCellSize, y);
          ctx.stroke();
        }
      }
    }

    // 2. Active Hovered Cell Highlight
    if (hoveredCell) {
      const hx = hoveredCell.c * baseCellSize;
      const hy = hoveredCell.r * baseCellSize;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 0.5, hy + 0.5, baseCellSize - 1, baseCellSize - 1);
    }
  }, [design.matrix, design.warpColor, design.zariColor, rows, cols, baseCellSize, hoveredCell]);

  // Convert client mouse/touch point to grid row and column
  const getCellCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { r: number; c: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const c = Math.floor(x / baseCellSize);
    const r = Math.floor(y / baseCellSize);

    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      return { r, c };
    }
    return null;
  };

  // Cell drawing action
  const applyToolToCell = (r: number, c: number) => {
    const curVal = design.matrix[r][c];
    let newVal = 1;
    if (activeTool === 'eraser') newVal = 0;
    else if (activeTool === 'zari') newVal = 2;
    else if (activeTool === 'pen') {
      // If single click on active cell, toggle it
      newVal = curVal === 1 ? 0 : 1;
    }

    if (activeTool === 'fill') {
      const fillVal = curVal === 1 ? 0 : 1;
      const filled = floodFill(design.matrix, r, c, fillVal);
      pushHistory(filled);
      return;
    }

    if (curVal !== newVal) {
      const updated = cloneMatrix(design.matrix);
      updated[r][c] = newVal;
      pushHistory(updated);
    }
  };

  // Drag stroke drawing action
  const applyStrokeToCell = (r: number, c: number) => {
    const curVal = design.matrix[r][c];
    const targetVal = activeTool === 'eraser' ? 0 : activeTool === 'zari' ? 2 : 1;
    if (curVal !== targetVal) {
      const updated = cloneMatrix(design.matrix);
      updated[r][c] = targetVal;
      pushHistory(updated);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.shiftKey) {
      // Middle click or shift drag to pan
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    isMouseDownRef.current = true;
    const coords = getCellCoords(e);
    if (coords) {
      lastDrawnCellRef.current = coords;
      applyToolToCell(coords.r, coords.c);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const coords = getCellCoords(e);
    setHoveredCell(coords);

    if (isMouseDownRef.current && coords) {
      if (
        !lastDrawnCellRef.current ||
        lastDrawnCellRef.current.r !== coords.r ||
        lastDrawnCellRef.current.c !== coords.c
      ) {
        lastDrawnCellRef.current = coords;
        applyStrokeToCell(coords.r, coords.c);
      }
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    setIsPanning(false);
    lastDrawnCellRef.current = null;
  };

  // Touch Handlers for Android & Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const coords = getCellCoords(e);
      if (coords) {
        isMouseDownRef.current = true;
        lastDrawnCellRef.current = coords;
        applyToolToCell(coords.r, coords.c);
      }
    } else if (e.touches.length === 2) {
      // Two-finger pan
      setIsPanning(true);
      setPanStart({
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - pan.x,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isPanning && e.touches.length === 2) {
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setPan({ x: midX - panStart.x, y: midY - panStart.y });
      return;
    }

    if (isMouseDownRef.current && e.touches.length === 1) {
      const coords = getCellCoords(e);
      if (coords) {
        setHoveredCell(coords);
        if (
          !lastDrawnCellRef.current ||
          lastDrawnCellRef.current.r !== coords.r ||
          lastDrawnCellRef.current.c !== coords.c
        ) {
          lastDrawnCellRef.current = coords;
          applyStrokeToCell(coords.r, coords.c);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    isMouseDownRef.current = false;
    setIsPanning(false);
  };

  // Dimension Change
  const handleDimensionChange = (newSize: number) => {
    const updated = createMatrix(newSize, newSize, 0);
    // Copy existing pattern into new dimensions
    for (let r = 0; r < Math.min(rows, newSize); r++) {
      for (let c = 0; c < Math.min(cols, newSize); c++) {
        updated[r][c] = design.matrix[r][c];
      }
    }
    onChange({
      ...design,
      width: newSize,
      height: newSize,
      matrix: updated,
      updatedAt: new Date().toISOString(),
    });
    pushHistory(updated);
  };

  // Matrix Transformations
  const handleClear = () => {
    const cleared = createMatrix(cols, rows, 0);
    pushHistory(cleared);
  };

  const handleInvert = () => {
    pushHistory(invertMatrix(design.matrix));
  };

  const handleMirrorH = () => {
    pushHistory(mirrorHorizontal(design.matrix));
  };

  const handleMirrorV = () => {
    pushHistory(mirrorVertical(design.matrix));
  };

  const handleRotate = () => {
    pushHistory(rotateMatrix90(design.matrix));
  };

  const handleCopy = () => {
    setClipboard(cloneMatrix(design.matrix));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handlePaste = () => {
    if (clipboard) {
      pushHistory(cloneMatrix(clipboard));
    }
  };

  // Preset Weaves Injector
  const injectPresetWeave = (type: 'plain' | 'twill' | 'satin' | 'diamond') => {
    const m = createMatrix(cols, rows, 0);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (type === 'plain') {
          m[r][c] = (r + c) % 2 === 0 ? 1 : 0;
        } else if (type === 'twill') {
          m[r][c] = (r + c) % 4 < 2 ? 1 : 0;
        } else if (type === 'satin') {
          m[r][c] = (r * 3 + c) % 5 === 0 ? 1 : 0;
        } else if (type === 'diamond') {
          const dr = Math.abs(r - rows / 2);
          const dc = Math.abs(c - cols / 2);
          m[r][c] = (dr + dc) % 4 < 2 ? 1 : 0;
        }
      }
    }
    pushHistory(m);
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0e15] text-slate-200 overflow-hidden">
      {/* Top Studio Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#131722] border-b border-slate-800">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 bg-[#090b10] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTool('pen')}
            title="Warp Up Pen (P)"
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'pen'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span className="hidden sm:inline">Warp Pen</span>
          </button>

          <button
            onClick={() => setActiveTool('zari')}
            title="Gold Zari Accent (Z)"
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'zari'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Zari</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            title="Erase / Weft Up (E)"
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'eraser'
                ? 'bg-slate-700 text-white font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Erase</span>
          </button>

          <button
            onClick={() => setActiveTool('fill')}
            title="Flood Fill Bucket (F)"
            className={`p-2 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-all ${
              activeTool === 'fill'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PaintBucket className="w-4 h-4" />
            <span className="hidden sm:inline">Fill</span>
          </button>
        </div>

        {/* History & Transformation Actions */}
        <div className="flex items-center gap-1 bg-[#090b10] p-1 rounded-xl border border-slate-800">
          <button
            onClick={undo}
            disabled={historyIdx === 0}
            title="Undo (Ctrl+Z)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyIdx >= history.length - 1}
            title="Redo (Ctrl+Y)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1"></div>
          <button
            onClick={handleMirrorH}
            title="Mirror Horizontally"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={handleMirrorV}
            title="Mirror Vertically"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          <button
            onClick={handleRotate}
            title="Rotate 90° Clockwise"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleInvert}
            title="Invert Weave (Warp ↔ Weft)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono font-medium transition-colors"
          >
            INV
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1"></div>
          <button
            onClick={handleCopy}
            title="Copy Motif (Ctrl+C)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
          >
            {copiedNotification ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleClear}
            title="Clear Entire Grid"
            className="p-2 rounded-lg text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Grid Size Presets & Zoom */}
        <div className="flex items-center gap-2">
          {/* Preset Grid Sizes */}
          <div className="flex items-center bg-[#090b10] rounded-xl p-1 border border-slate-800">
            <span className="text-[11px] font-mono text-slate-400 px-2">Size:</span>
            {[8, 16, 24, 32, 48, 64].map(s => (
              <button
                key={s}
                onClick={() => handleDimensionChange(s)}
                className={`px-2 py-1 text-xs font-mono rounded-lg transition-colors ${
                  cols === s
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#090b10] rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setZoom(z => Math.max(0.4, z / 1.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1.5 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(6.0, z * 1.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Import Motif Button */}
          <button
            onClick={() => setShowImporter(true)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Image</span>
          </button>
        </div>
      </div>

      {/* Main Studio Area: Left Canvas, Right Properties */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Canvas Workspace Viewport */}
        <div
          ref={containerRef}
          className="lg:col-span-8 xl:col-span-9 relative flex items-center justify-center bg-[#08090e] p-6 overflow-auto select-none"
        >
          {/* Coordinate HUD */}
          {showCoordinates && (
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-[#121622]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-400 shadow-lg">
              <span>
                Grid: <strong className="text-slate-200">{cols} ends × {rows} picks</strong>
              </span>
              <span>•</span>
              <span>
                Cursor:{' '}
                {hoveredCell ? (
                  <strong className="text-amber-400">
                    Pick {hoveredCell.r + 1}, End {hoveredCell.c + 1}
                  </strong>
                ) : (
                  '--'
                )}
              </span>
              <span>•</span>
              <span>
                Shaft: <strong className="text-sky-300">{draftResult.minShaftsNeeded} / {design.numShafts}</strong>
              </span>
            </div>
          )}

          {/* Grid Paper Canvas with Pan & Zoom Transform */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="relative shadow-2xl rounded-sm border-2 border-slate-700/80 bg-[#161922]"
          >
            {/* Column Coordinates Header (Warp Ends 1..Cols) */}
            <div
              className="flex bg-[#121622] border-b border-slate-800 text-[9px] font-mono text-slate-500 overflow-hidden"
              style={{ width: cols * baseCellSize }}
            >
              {Array.from({ length: cols }).map((_, c) => (
                <div
                  key={c}
                  style={{ width: baseCellSize }}
                  className="text-center shrink-0 border-r border-slate-800/40 py-0.5 truncate"
                >
                  {c % 4 === 0 ? c + 1 : ''}
                </div>
              ))}
            </div>

            {/* Canvas with Row Numbers Left Sidebar */}
            <div className="flex">
              {/* Row Numbers (Picks 1..Rows) */}
              <div
                className="flex flex-col bg-[#121622] border-r border-slate-800 text-[9px] font-mono text-slate-500 overflow-hidden"
                style={{ height: rows * baseCellSize }}
              >
                {Array.from({ length: rows }).map((_, r) => (
                  <div
                    key={r}
                    style={{ height: baseCellSize }}
                    className="flex items-center justify-center px-1 border-b border-slate-800/40 shrink-0"
                  >
                    {r % 4 === 0 ? r + 1 : ''}
                  </div>
                ))}
              </div>

              {/* The Interactive Weave Grid Canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="cursor-crosshair block"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Dobby Textile & Loom Properties */}
        <div className="lg:col-span-4 xl:col-span-3 bg-[#11141f] border-l border-slate-800 p-5 overflow-y-auto space-y-6">
          {/* Quick Simulation CTA */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-600/20 to-emerald-600/20 border border-amber-500/30 shadow-lg">
            <h4 className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1">
              Ready to Weave?
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              Step into the virtual loom to watch heald shafts lift and the shuttle shoot across the shed!
            </p>
            <div className="flex gap-2">
              <button
                onClick={onSimulate}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Weaving</span>
              </button>
              <button
                onClick={onOpenStructure}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Inspect Weave Structure"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Colour System */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-amber-400" />
                Color System
              </label>
              <span className="text-[11px] text-slate-500">Hex / RGB</span>
            </div>

            {/* Presets dropdown */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Traditional Handloom Palettes:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {TEXTILE_COLOR_PALETTES.slice(0, 4).map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      onChange({
                        ...design,
                        warpColor: p.warp,
                        weftColor: p.weft,
                        zariColor: p.zari,
                        bgColor: p.bg,
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left text-[11px] flex items-center justify-between"
                  >
                    <span className="truncate text-slate-200">{p.name}</span>
                    <div className="flex gap-0.5 shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.warp }}></span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.weft }}></span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.zari }}></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Pickers */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Warp Yarn</span>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <input
                    type="color"
                    value={design.warpColor}
                    onChange={e => onChange({ ...design, warpColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">{design.warpColor}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Weft Yarn</span>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <input
                    type="color"
                    value={design.weftColor}
                    onChange={e => onChange({ ...design, weftColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">{design.weftColor}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Zari Accent</span>
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                  <input
                    type="color"
                    value={design.zariColor}
                    onChange={e => onChange({ ...design, zariColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate">{design.zariColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Loom & Shaft Configuration */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-400" />
              Loom & Shaft Settings
            </label>

            {/* Shaft Capacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Heald Shafts Available</span>
                <span className="text-amber-400 font-mono font-bold">{design.numShafts} Shafts</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[8, 12, 16, 24].map(num => (
                  <button
                    key={num}
                    onClick={() => onChange({ ...design, numShafts: num })}
                    className={`py-1.5 rounded-lg text-xs font-mono font-medium ${
                      design.numShafts === num
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {num} Shafts
                  </button>
                ))}
              </div>
            </div>

            {/* Drafting Method */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Drafting Method</span>
              <div className="grid grid-cols-3 gap-1">
                {(['reduced', 'straight', 'point'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => onChange({ ...design, draftingMethod: method })}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium capitalize truncate ${
                      design.draftingMethod === method
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Shaft Status Badge */}
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                draftResult.capacityExceeded
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              <span>Min Shafts Needed:</span>
              <strong className="font-mono text-sm">
                {draftResult.minShaftsNeeded} / {design.numShafts}
              </strong>
            </div>
          </div>

          {/* Density (EPI / PPI) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Density (EPI & PPI)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">EPI (Warp)</span>
                  <span className="text-amber-400 font-mono">{design.epi}</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="120"
                  step="2"
                  value={design.epi}
                  onChange={e => onChange({ ...design, epi: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">PPI (Weft)</span>
                  <span className="text-amber-400 font-mono">{design.ppi}</span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="120"
                  step="2"
                  value={design.ppi}
                  onChange={e => onChange({ ...design, ppi: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Density Aspect Ratio readout */}
            <div className="text-[11px] text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between">
              <span>Aspect Ratio:</span>
              <span className="text-amber-300">
                {(design.ppi / design.epi).toFixed(2)}x{' '}
                {Math.abs(design.ppi - design.epi) > 10 && (
                  <span className="text-amber-400 font-sans">(Motif distorted)</span>
                )}
              </span>
            </div>
          </div>

          {/* Quick Preset Weaves */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Quick Fundamental Weaves:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => injectPresetWeave('plain')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Plain 1/1
              </button>
              <button
                onClick={() => injectPresetWeave('twill')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Twill 2/2
              </button>
              <button
                onClick={() => injectPresetWeave('satin')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Satin 5
              </button>
              <button
                onClick={() => injectPresetWeave('diamond')}
                className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Diamond Dobby
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Motif Importer Modal */}
      {showImporter && (
        <MotifImporter
          onCancel={() => setShowImporter(false)}
          onImport={(importedMatrix, w, h) => {
            onChange({
              ...design,
              width: w,
              height: h,
              matrix: importedMatrix,
              updatedAt: new Date().toISOString(),
            });
            pushHistory(importedMatrix);
            setShowImporter(false);
          }}
        />
      )}
    </div>
  );
};
