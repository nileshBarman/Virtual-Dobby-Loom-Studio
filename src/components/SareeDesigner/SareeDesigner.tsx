import React, { useState, useRef, useEffect } from 'react';
import { Layers, Sliders, Palette, Sparkles, Download, Ruler, Eye, ArrowRight, Grid } from 'lucide-react';
import { DobbyDesign, SareeConfig } from '../../types';
import { generateRepeat } from '../../weave-engine';
import { renderFabric } from '../../fabric-renderer/renderFabric';

interface SareeDesignerProps {
  currentDesign: DobbyDesign;
  allDesigns: DobbyDesign[];
}

export const SareeDesigner: React.FC<SareeDesignerProps> = ({ currentDesign, allDesigns }) => {
  const [activeSubMode, setActiveSubMode] = useState<'full' | 'border' | 'pallu'>('full');

  // Saree technical layout configuration
  const [sareeConfig, setSareeConfig] = useState<SareeConfig>({
    totalLengthMeters: 5.5,
    widthInches: 46,
    bodyColor: '#0e274a', // Royal Navy Blue
    bodyPatternType: 'butti',
    topBorderWidthInches: 3.5,
    bottomBorderWidthInches: 6.0,
    borderDesignId: currentDesign.id,
    borderZari: true,
    borderMirror: true,
    palluLengthInches: 32,
    palluDesignId: currentDesign.id,
    palluZariBandsCount: 4,
    blouseLengthInches: 32,
    blouseColor: '#2d4a3e', // Contrast Muted Green
    blouseContrast: true,
    blouseBorder: true,
  });

  const fullSareeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const borderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const palluCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Full Panoramic Saree Layout
  useEffect(() => {
    const canvas = fullSareeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Scaling: 5.5m is ~216 inches long, 46 inches wide
    // We map length to width of canvas, and width to height of canvas
    const borderTopH = (sareeConfig.topBorderWidthInches / sareeConfig.widthInches) * height;
    const borderBottomH = (sareeConfig.bottomBorderWidthInches / sareeConfig.widthInches) * height;
    const bodyFieldH = height - borderTopH - borderBottomH;

    // Sections across length:
    // Blouse: 32" / 216" ~ 15%
    // Body: ~ 70%
    // Pallu: 32" / 216" ~ 15%
    const totalInches = sareeConfig.totalLengthMeters * 39.37;
    const blouseW = (sareeConfig.blouseLengthInches / totalInches) * width;
    const palluW = (sareeConfig.palluLengthInches / totalInches) * width;
    const bodyW = width - blouseW - palluW;

    const blouseX = 0;
    const bodyX = blouseW;
    const palluX = blouseW + bodyW;

    // 1. Draw Saree Body Field
    ctx.fillStyle = sareeConfig.bodyColor;
    ctx.fillRect(bodyX, borderTopH, bodyW, bodyFieldH);

    // Draw Butti / Motifs across body field
    if (sareeConfig.bodyPatternType === 'butti') {
      ctx.fillStyle = sareeConfig.borderZari ? '#fcd34d' : '#ffffff';
      const spacingX = 36;
      const spacingY = 28;
      for (let bx = bodyX + 20; bx < bodyX + bodyW - 20; bx += spacingX) {
        for (let by = borderTopH + 15; by < borderTopH + bodyFieldH - 15; by += spacingY) {
          // Delicate gold zari butti floret
          ctx.beginPath();
          ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw Top Border (Continuous length across body and pallu)
    const topBorderGrad = ctx.createLinearGradient(0, 0, 0, borderTopH);
    topBorderGrad.addColorStop(0, '#1c1917');
    topBorderGrad.addColorStop(0.5, sareeConfig.borderZari ? '#b45309' : sareeConfig.bodyColor);
    topBorderGrad.addColorStop(1, '#0c0a09');

    ctx.fillStyle = topBorderGrad;
    ctx.fillRect(0, 0, width, borderTopH);

    // Top border zari stripes
    if (sareeConfig.borderZari) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, borderTopH - 3, width, 2);
      ctx.fillRect(0, 2, width, 1.5);
    }

    // 3. Draw Bottom Border (Wider, prominent dobby border)
    const bottomY = height - borderBottomH;
    const bottomBorderGrad = ctx.createLinearGradient(0, bottomY, 0, height);
    bottomBorderGrad.addColorStop(0, '#0c0a09');
    bottomBorderGrad.addColorStop(0.5, sareeConfig.borderZari ? '#b45309' : sareeConfig.bodyColor);
    bottomBorderGrad.addColorStop(1, '#1c1917');

    ctx.fillStyle = bottomBorderGrad;
    ctx.fillRect(0, bottomY, width, borderBottomH);

    // Bottom border zari lines and temple triangles
    if (sareeConfig.borderZari) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, bottomY + 2, width, 3);
      ctx.fillRect(0, height - 4, width, 2);

      // Micro temple chevrons along bottom border
      for (let tx = 0; tx < width; tx += 12) {
        ctx.beginPath();
        ctx.moveTo(tx, bottomY + 5);
        ctx.lineTo(tx + 6, bottomY + 12);
        ctx.lineTo(tx + 12, bottomY + 5);
        ctx.fill();
      }
    }

    // 4. Draw Pallu (Grand End Piece)
    const palluGrad = ctx.createLinearGradient(palluX, 0, width, 0);
    palluGrad.addColorStop(0, '#78350f');
    palluGrad.addColorStop(0.3, '#b45309');
    palluGrad.addColorStop(0.7, '#d97706');
    palluGrad.addColorStop(1, '#92400e');

    ctx.fillStyle = palluGrad;
    ctx.fillRect(palluX, borderTopH, palluW, bodyFieldH);

    // Pallu Zari Cross-Bands (Horizontal stripes of gold zari)
    const bandStep = palluW / (sareeConfig.palluZariBandsCount + 1);
    for (let i = 1; i <= sareeConfig.palluZariBandsCount; i++) {
      const zx = palluX + i * bandStep;
      ctx.fillStyle = '#fde047';
      ctx.fillRect(zx - 3, borderTopH, 6, bodyFieldH);

      // Diamond accents in zari band
      for (let zy = borderTopH + 12; zy < borderTopH + bodyFieldH - 12; zy += 16) {
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.moveTo(zx, zy - 4);
        ctx.lineTo(zx + 3, zy);
        ctx.lineTo(zx, zy + 4);
        ctx.lineTo(zx - 3, zy);
        ctx.fill();
      }
    }

    // Pallu Fringe / Tassels (End of saree)
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    for (let fy = 0; fy < height; fy += 6) {
      ctx.beginPath();
      ctx.moveTo(width - 4, fy);
      ctx.lineTo(width, fy + 2);
      ctx.stroke();
    }

    // 5. Draw Blouse Piece
    ctx.fillStyle = sareeConfig.blouseContrast ? sareeConfig.blouseColor : sareeConfig.bodyColor;
    ctx.fillRect(blouseX, borderTopH, blouseW, bodyFieldH);

    // Blouse boundary dashed separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(blouseW, 0);
    ctx.lineTo(blouseW, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Text labels on panoramic canvas
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px monospace';
    ctx.fillText('BLOUSE PIECE (32")', blouseX + 10, height / 2);
    ctx.fillText('SAREE BODY FIELD', bodyX + bodyW / 2 - 50, height / 2);
    ctx.fillText('PALLU / ANCHAL (32")', palluX + 15, height / 2);
  }, [sareeConfig]);

  // Render Continuous Border Preview
  useEffect(() => {
    const canvas = borderCanvasRef.current;
    if (!canvas) return;

    // Repeat motif horizontally 8 times for continuous border preview
    const repeated = generateRepeat(currentDesign.matrix, 'mirror-h', 8, 1);
    renderFabric(canvas, {
      matrix: repeated,
      warpColor: currentDesign.warpColor,
      weftColor: currentDesign.weftColor,
      zariColor: currentDesign.zariColor,
      bgColor: '#090b10',
      epi: currentDesign.epi,
      ppi: currentDesign.ppi,
      zoom: 1.0,
      warpYarn: currentDesign.warpYarn,
      weftYarn: currentDesign.weftYarn,
      viewMode: 'fabric',
      showGridLines: false,
    });
  }, [currentDesign]);

  // Calculate technical yarn requirements
  const totalLengthM = sareeConfig.totalLengthMeters;
  const widthM = (sareeConfig.widthInches * 2.54) / 100;
  const squareMeters = totalLengthM * widthM;
  // Estimated yarn weight in grams (approx. for silk/cotton handloom saree ~450g - 750g)
  const estSilkGrams = Math.round(squareMeters * 65);
  const estWeftGrams = Math.round(squareMeters * 75);
  const estZariGrams = sareeConfig.borderZari ? Math.round(sareeConfig.palluZariBandsCount * 30 + 60) : 0;
  const totalGrams = estSilkGrams + estWeftGrams + estZariGrams;

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 overflow-y-auto">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#121622] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Traditional Saree Designer</h2>
            <p className="text-xs text-slate-400">
              Architect complete 5.5m to 6.2m sarees with Body, Borders, Pallu, and Blouse
            </p>
          </div>
        </div>

        {/* Sub-Mode Tabs */}
        <div className="flex items-center bg-[#090b10] rounded-xl p-1 border border-slate-800">
          <button
            onClick={() => setActiveSubMode('full')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubMode === 'full'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Saree Drape Layout
          </button>
          <button
            onClick={() => setActiveSubMode('border')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubMode === 'border'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dedicated Border Mode
          </button>
          <button
            onClick={() => setActiveSubMode('pallu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubMode === 'pallu'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dedicated Pallu Mode
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        {/* Left Column: Visual Canvas Area */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {activeSubMode === 'full' && (
            <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Full Length Saree Architecture (5.5m × 46")
                </span>
                <span className="text-xs font-mono text-amber-400">
                  Total Weight: ~{totalGrams}g (Pure Handloom)
                </span>
              </div>

              {/* Panoramic Canvas */}
              <div className="bg-[#090b10] rounded-xl p-4 border border-slate-800/80 flex items-center justify-center overflow-x-auto shadow-inner">
                <canvas
                  ref={fullSareeCanvasRef}
                  width={780}
                  height={240}
                  className="rounded border border-slate-700/60 shadow-xl max-w-full"
                />
              </div>

              {/* Key Sections Legend */}
              <div className="grid grid-cols-4 gap-2 mt-4 text-xs font-medium text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CUT SECTION</span>
                  <span className="text-slate-200">Blouse (32")</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">MAIN FIELD</span>
                  <span className="text-slate-200">Body (~152")</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">TOP & BOTTOM</span>
                  <span className="text-slate-200">Dobby Borders</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">GRAND ANCHAL</span>
                  <span className="text-amber-400">Pallu (32")</span>
                </div>
              </div>
            </div>
          )}

          {activeSubMode === 'border' && (
            <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Continuous Border Simulation</h3>
                <p className="text-xs text-slate-400">
                  Seamless repeating dobby border running along the saree edge
                </p>
              </div>

              <div className="bg-[#090b10] rounded-xl p-4 border border-slate-800/80 flex items-center justify-center overflow-x-auto">
                <canvas ref={borderCanvasRef} className="rounded shadow-xl max-w-full" />
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="text-amber-300 font-semibold block">Border Technical Flow:</span>
                <p className="text-slate-300">
                  Graph Unit ({currentDesign.width} ends × {currentDesign.height} picks) → Mirror Repeat →
                  Continuous Border running the full 5.5 meters with dedicated Zari heald shafts.
                </p>
              </div>
            </div>
          )}

          {activeSubMode === 'pallu' && (
            <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">Pallu (Anchal) Master Layout</h3>
                <p className="text-xs text-slate-400">
                  Zari cross-bands, geometric dobby transitions, and tassel fringe
                </p>
              </div>

              <div className="p-6 bg-[#090b10] rounded-xl border border-slate-800 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-sm font-semibold text-white">
                  {sareeConfig.palluZariBandsCount} Gold Zari Cross-Bands Active
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The pallu utilizes extra weft dobby lifting with tested zari thread to create rich metallic
                  bands that contrast with the main body color.
                </p>
              </div>
            </div>
          )}

          {/* Yarn Consumption & Technical Specification Sheet */}
          <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Weaving Specification & Raw Material Consumption
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#0a0c12] rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Warp Yarn Requirement:</span>
                <strong className="text-sm font-mono text-slate-100">~{estSilkGrams}g</strong>
                <span className="text-[10px] text-slate-400 block">Mulberry Silk 20/22D</span>
              </div>
              <div className="p-3 bg-[#0a0c12] rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Weft Yarn Requirement:</span>
                <strong className="text-sm font-mono text-slate-100">~{estWeftGrams}g</strong>
                <span className="text-[10px] text-slate-400 block">Cotton / Silk 2/80s</span>
              </div>
              <div className="p-3 bg-[#0a0c12] rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Metallic Zari (Borders):</span>
                <strong className="text-sm font-mono text-amber-300">~{estZariGrams}g</strong>
                <span className="text-[10px] text-slate-400 block">Tested Silver/Gold Zari</span>
              </div>
              <div className="p-3 bg-[#0a0c12] rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Estimated Saree Weight:</span>
                <strong className="text-sm font-mono text-emerald-400">~{totalGrams}g</strong>
                <span className="text-[10px] text-slate-400 block">Finished piece</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Saree Parameters Configuration */}
        <div className="lg:col-span-4 bg-[#11141f] rounded-2xl border border-slate-800 p-5 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Saree Dimensions & Parameters
            </h3>
          </div>

          {/* Saree Dimensions */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Total Saree Length</span>
                <span className="text-amber-400 font-mono">{sareeConfig.totalLengthMeters} Meters</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="6.5"
                step="0.1"
                value={sareeConfig.totalLengthMeters}
                onChange={e =>
                  setSareeConfig({ ...sareeConfig, totalLengthMeters: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Saree Width (Reed Width)</span>
                <span className="text-amber-400 font-mono">{sareeConfig.widthInches} Inches</span>
              </div>
              <input
                type="range"
                min="42"
                max="50"
                value={sareeConfig.widthInches}
                onChange={e => setSareeConfig({ ...sareeConfig, widthInches: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Border Width Controls */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block">Border Widths</span>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Top Border Width</span>
                <span className="text-slate-200 font-mono">{sareeConfig.topBorderWidthInches}"</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="6.0"
                step="0.5"
                value={sareeConfig.topBorderWidthInches}
                onChange={e =>
                  setSareeConfig({ ...sareeConfig, topBorderWidthInches: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Bottom Border Width (Skirter)</span>
                <span className="text-slate-200 font-mono">{sareeConfig.bottomBorderWidthInches}"</span>
              </div>
              <input
                type="range"
                min="3.0"
                max="12.0"
                step="0.5"
                value={sareeConfig.bottomBorderWidthInches}
                onChange={e =>
                  setSareeConfig({ ...sareeConfig, bottomBorderWidthInches: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Pallu & Blouse Controls */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block">Pallu & Blouse Controls</span>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Pallu Length</span>
                <span className="text-slate-200 font-mono">{sareeConfig.palluLengthInches} Inches</span>
              </div>
              <input
                type="range"
                min="24"
                max="48"
                step="2"
                value={sareeConfig.palluLengthInches}
                onChange={e =>
                  setSareeConfig({ ...sareeConfig, palluLengthInches: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Pallu Zari Bands</span>
                <span className="text-amber-400 font-mono">{sareeConfig.palluZariBandsCount} Bands</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[2, 3, 4, 6].map(b => (
                  <button
                    key={b}
                    onClick={() => setSareeConfig({ ...sareeConfig, palluZariBandsCount: b })}
                    className={`py-1.5 rounded text-xs font-mono ${
                      sareeConfig.palluZariBandsCount === b
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {b} Bands
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={sareeConfig.blouseContrast}
                  onChange={e =>
                    setSareeConfig({ ...sareeConfig, blouseContrast: e.target.checked })
                  }
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                Contrasting Blouse Section
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
