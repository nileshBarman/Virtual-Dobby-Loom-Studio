import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Sliders, Check, ArrowRight, RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import { GridMatrix } from '../types';
import { createMatrix } from '../weave-engine';

interface MotifImporterProps {
  onImport: (matrix: GridMatrix, width: number, height: number) => void;
  onCancel: () => void;
}

export const MotifImporter: React.FC<MotifImporterProps> = ({ onImport, onCancel }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gridWidth, setGridWidth] = useState<number>(24);
  const [gridHeight, setGridHeight] = useState<number>(24);
  const [threshold, setThreshold] = useState<number>(128); // 0 to 255
  const [contrast, setContrast] = useState<number>(1.2); // 0.5 to 2.5
  const [brightness, setBrightness] = useState<number>(0); // -100 to 100
  const [invert, setInvert] = useState<boolean>(false);
  const [addZariContour, setAddZariContour] = useState<boolean>(true);

  const [convertedMatrix, setConvertedMatrix] = useState<GridMatrix | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load sample image if none uploaded yet
  useEffect(() => {
    // Generate a default high-contrast floral paisley motif on a canvas for instant testing
    const demoCanvas = document.createElement('canvas');
    demoCanvas.width = 160;
    demoCanvas.height = 160;
    const ctx = demoCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 160, 160);

      ctx.fillStyle = '#111827';
      // Draw paisley/butti motif
      ctx.beginPath();
      ctx.arc(80, 95, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(80, 53);
      ctx.quadraticCurveTo(130, 40, 110, 15);
      ctx.quadraticCurveTo(80, 30, 80, 55);
      ctx.fill();

      // Paisley inner cutout
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(80, 95, 20, 0, Math.PI * 2);
      ctx.fill();

      setImageSrc(demoCanvas.toDataURL('image/png'));
    }
  }, []);

  // Process image and convert to discrete grid matrix
  const processImage = useCallback(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 1. Draw Original Image
      const origCanvas = originalCanvasRef.current;
      if (origCanvas) {
        origCanvas.width = 160;
        origCanvas.height = 160;
        const oCtx = origCanvas.getContext('2d');
        if (oCtx) {
          oCtx.clearRect(0, 0, 160, 160);
          oCtx.drawImage(img, 0, 0, 160, 160);
        }
      }

      // 2. Downsample to target grid size
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = gridWidth;
      sampleCanvas.height = gridHeight;
      const sCtx = sampleCanvas.getContext('2d');
      if (!sCtx) return;

      sCtx.drawImage(img, 0, 0, gridWidth, gridHeight);
      const imgData = sCtx.getImageData(0, 0, gridWidth, gridHeight);
      const pixels = imgData.data;

      const matrix = createMatrix(gridWidth, gridHeight, 0);

      // Contrast factor calculation
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let r = 0; r < gridHeight; r++) {
        for (let c = 0; c < gridWidth; c++) {
          const idx = (r * gridWidth + c) * 4;
          let red = pixels[idx];
          let green = pixels[idx + 1];
          let blue = pixels[idx + 2];

          // Apply brightness
          red += brightness;
          green += brightness;
          blue += brightness;

          // Apply contrast
          red = factor * (red - 128) + 128;
          green = factor * (green - 128) + 128;
          blue = factor * (blue - 128) + 128;

          // Grayscale luminance
          const luminance = 0.299 * red + 0.587 * green + 0.114 * blue;

          // Thresholding
          let isForeground = luminance < threshold;
          if (invert) isForeground = !isForeground;

          matrix[r][c] = isForeground ? 1 : 0;
        }
      }

      // Optional: Add Zari contour outlining foreground motifs
      if (addZariContour) {
        for (let r = 0; r < gridHeight; r++) {
          for (let c = 0; c < gridWidth; c++) {
            if (matrix[r][c] === 1) {
              // check if cell is on the contour border
              const isBorder =
                r === 0 ||
                r === gridHeight - 1 ||
                c === 0 ||
                c === gridWidth - 1 ||
                matrix[r - 1]?.[c] === 0 ||
                matrix[r + 1]?.[c] === 0 ||
                matrix[r]?.[c - 1] === 0 ||
                matrix[r]?.[c + 1] === 0;

              if (isBorder) {
                matrix[r][c] = 2; // Zari edge
              }
            }
          }
        }
      }

      setConvertedMatrix(matrix);

      // 3. Render Pixel Preview Canvas
      const pCanvas = pixelCanvasRef.current;
      if (pCanvas) {
        pCanvas.width = 160;
        pCanvas.height = 160;
        const pCtx = pCanvas.getContext('2d');
        if (pCtx) {
          pCtx.clearRect(0, 0, 160, 160);
          const cellW = 160 / gridWidth;
          const cellH = 160 / gridHeight;
          for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
              const val = matrix[r][c];
              pCtx.fillStyle = val === 2 ? '#f59e0b' : val === 1 ? '#38bdf8' : '#1e293b';
              pCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
              pCtx.strokeStyle = 'rgba(255,255,255,0.08)';
              pCtx.strokeRect(c * cellW, r * cellH, cellW, cellH);
            }
          }
        }
      }

      // 4. Render Dobby Graph Preview Canvas
      const gCanvas = graphCanvasRef.current;
      if (gCanvas) {
        gCanvas.width = 160;
        gCanvas.height = 160;
        const gCtx = gCanvas.getContext('2d');
        if (gCtx) {
          gCtx.clearRect(0, 0, 160, 160);
          const cellW = 160 / gridWidth;
          const cellH = 160 / gridHeight;
          for (let r = 0; r < gridHeight; r++) {
            for (let c = 0; c < gridWidth; c++) {
              const val = matrix[r][c];
              gCtx.fillStyle = val === 2 ? '#f59e0b' : val === 1 ? '#ffffff' : '#0f172a';
              gCtx.fillRect(c * cellW, r * cellH, cellW, cellH);
              gCtx.strokeStyle = 'rgba(255,255,255,0.15)';
              gCtx.strokeRect(c * cellW, r * cellH, cellW, cellH);
            }
          }
        }
      }
    };
    img.src = imageSrc;
  }, [imageSrc, gridWidth, gridHeight, threshold, contrast, brightness, invert, addZariContour]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  // Handle image upload from user device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setImageSrc(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (convertedMatrix) {
      onImport(convertedMatrix, gridWidth, gridHeight);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#121622] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#161a29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Import Motif into Dobby Graph</h3>
              <p className="text-xs text-slate-400">
                Upload artwork or photos and mathematically convert to weave grid cells
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* File Upload Zone */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-slate-700 bg-[#0d1017]">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-8 h-8 text-amber-400/80" />
              <div>
                <p className="text-sm font-medium text-slate-200">Upload Image File (JPG, PNG, WEBP)</p>
                <p className="text-xs text-slate-400">High-contrast silhouettes and geometric motifs convert best</p>
              </div>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                Choose Local File
              </button>
            </div>
          </div>

          {/* Three-Stage Pipeline Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Original Image */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-[#090b10] border border-slate-800">
              <span className="text-xs font-mono font-medium text-slate-400 mb-2 uppercase">1. Original Image</span>
              <div className="w-40 h-40 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <canvas ref={originalCanvasRef} className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Step 2: Pixel Conversion */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-[#090b10] border border-slate-800">
              <span className="text-xs font-mono font-medium text-amber-400 mb-2 uppercase">2. Pixel Conversion</span>
              <div className="w-40 h-40 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <canvas ref={pixelCanvasRef} className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Step 3: Dobby Graph */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-[#090b10] border border-slate-800">
              <span className="text-xs font-mono font-medium text-emerald-400 mb-2 uppercase">3. Dobby Graph</span>
              <div className="w-40 h-40 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <canvas ref={graphCanvasRef} className="w-full h-full object-contain" />
              </div>
            </div>
          </div>

          {/* Conversion Control Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0e121a] border border-slate-800">
            {/* Target Dimensions */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Grid Dimensions</label>
              <div className="grid grid-cols-4 gap-2">
                {[16, 24, 32, 48].map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      setGridWidth(size);
                      setGridHeight(size);
                    }}
                    className={`py-1.5 rounded text-xs font-mono ${
                      gridWidth === size
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Binarize Threshold</span>
                <span className="text-amber-400 font-mono">{threshold}</span>
              </div>
              <input
                type="range"
                min="10"
                max="245"
                value={threshold}
                onChange={e => setThreshold(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Contrast Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Contrast Boost</span>
                <span className="text-amber-400 font-mono">{contrast.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={contrast}
                onChange={e => setContrast(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Brightness Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Brightness Offset</span>
                <span className="text-amber-400 font-mono">{brightness}</span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                value={brightness}
                onChange={e => setBrightness(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 md:col-span-2 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={invert}
                  onChange={e => setInvert(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                Invert Positive / Negative
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={addZariContour}
                  onChange={e => setAddZariContour(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                Add Gold Zari Contour Outline
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#141824] flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleApply}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all"
          >
            <Check className="w-4 h-4" />
            Apply to Active Dobby Studio ({gridWidth}×{gridHeight})
          </button>
        </div>
      </div>
    </div>
  );
};
