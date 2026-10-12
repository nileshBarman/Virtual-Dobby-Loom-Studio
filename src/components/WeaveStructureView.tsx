import React, { useRef, useEffect, useState } from 'react';
import {
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Sliders,
  Grid,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import { DobbyDesign, RepeatType, YarnMaterial } from '../types';
import { generateRepeat, generateLoomDraft, validateDesign, calculateFloats } from '../weave-engine';
import { renderFabric, exportFabricImage } from '../fabric-renderer/renderFabric';

interface WeaveStructureViewProps {
  design: DobbyDesign;
  onChange: (updated: DobbyDesign) => void;
  onOpenSimulator: () => void;
}

export const WeaveStructureView: React.FC<WeaveStructureViewProps> = ({
  design,
  onChange,
  onOpenSimulator,
}) => {
  const [viewMode, setViewMode] = useState<'fabric' | 'structure' | 'graph'>('fabric');
  const [zoom, setZoom] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<'preview' | 'drafting' | 'errors'>('preview');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute repeated matrix
  const repeatMatrix = generateRepeat(
    design.matrix,
    design.repeatType,
    design.repeatMultiplierX,
    design.repeatMultiplierY
  );

  // Compute draft and lifting plan
  const draftResult = generateLoomDraft(design.matrix, design.numShafts, design.draftingMethod);

  // Compute technical diagnostics
  const issues = validateDesign(design.matrix, design.epi, design.ppi, design.numShafts);
  const floatStats = calculateFloats(design.matrix);

  const errorCount = issues.filter(i => i.severity === 'problem').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  // Render on canvas whenever settings change
  useEffect(() => {
    if (!canvasRef.current) return;
    renderFabric(canvasRef.current, {
      matrix: repeatMatrix,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      zariColor: design.zariColor,
      bgColor: design.bgColor,
      epi: design.epi,
      ppi: design.ppi,
      zoom,
      warpYarn: design.warpYarn,
      weftYarn: design.weftYarn,
      viewMode,
      showGridLines: true,
    });
  }, [repeatMatrix, design, zoom, viewMode]);

  // Download high-res sample
  const handleDownloadSample = () => {
    const dataUrl = exportFabricImage({
      matrix: repeatMatrix,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      zariColor: design.zariColor,
      bgColor: design.bgColor,
      epi: design.epi,
      ppi: design.ppi,
      zoom: 2.0,
      warpYarn: design.warpYarn,
      weftYarn: design.weftYarn,
      viewMode: 'fabric',
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${design.name.toLowerCase().replace(/\s+/g, '-')}-fabric-preview.png`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200">
      {/* Top Mode Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#121622] border-b border-slate-800">
        <div className="flex items-center gap-2">
          {/* Mode Switcher: Mode A Graph, Mode B Structure, Mode C Fabric */}
          <div className="flex items-center bg-[#090b10] rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'graph'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mode A: Graph
            </button>
            <button
              onClick={() => setViewMode('structure')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'structure'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mode B: Structure
            </button>
            <button
              onClick={() => setViewMode('fabric')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'fabric'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mode C: Fabric View
            </button>
          </div>

          {/* Sub Tabs */}
          <div className="flex items-center bg-[#090b10] rounded-xl p-1 border border-slate-800 ml-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fabric Visual
            </button>
            <button
              onClick={() => setActiveTab('drafting')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'drafting' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lifting & Peg Plan
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                activeTab === 'errors' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Technical Check</span>
              {errorCount > 0 ? (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                  {errorCount}
                </span>
              ) : warningCount > 0 ? (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-mono font-bold">
                  {warningCount}
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Preset Zoom Levels */}
          <div className="flex items-center bg-[#090b10] rounded-xl p-1 border border-slate-800">
            {[0.5, 1.0, 2.0, 4.0, 8.0].map(lvl => (
              <button
                key={lvl}
                onClick={() => setZoom(lvl)}
                className={`px-2 py-1 text-xs font-mono rounded ${
                  zoom === lvl ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {Math.round(lvl * 100)}%
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadSample}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download High-Res Fabric Image"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenSimulator}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Simulate Weaving</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Main Center Canvas / View */}
        <div className="lg:col-span-8 xl:col-span-9 relative flex items-center justify-center bg-[#07080d] p-6 overflow-auto">
          {activeTab === 'preview' && (
            <div className="relative shadow-2xl rounded-lg border border-slate-800 bg-[#0d1017] p-2 max-w-full max-h-full overflow-auto">
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
            </div>
          )}

          {activeTab === 'drafting' && (
            <div className="w-full max-w-3xl bg-[#11141f] rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 overflow-y-auto max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-semibold text-white">Loom Drafting & Lifting Plan</h3>
                  <p className="text-xs text-slate-400">
                    Mathematical mapping between design ends/picks and heald shafts
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    Capacity: {draftResult.minShaftsNeeded} / {design.numShafts} Shafts
                  </span>
                </div>
              </div>

              {/* 1. Drafting Plan Diagram */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Heald Shaft Drafting Plan ({design.width} warp ends)
                </h4>
                <div className="bg-[#090b10] p-3 rounded-xl border border-slate-800 overflow-x-auto">
                  <div className="flex flex-col gap-1 min-w-[320px]">
                    {Array.from({ length: Math.min(16, design.numShafts) }).map((_, shaftRev) => {
                      const shaftIdx = Math.min(16, design.numShafts) - 1 - shaftRev;
                      return (
                        <div key={shaftIdx} className="flex items-center gap-1">
                          <span className="w-12 text-[10px] font-mono text-slate-400 text-right pr-2">
                            S{shaftIdx + 1}
                          </span>
                          <div className="flex gap-1">
                            {draftResult.drafting.map((assignedShaft, endIdx) => (
                              <div
                                key={endIdx}
                                className={`w-5 h-5 rounded text-[10px] font-mono flex items-center justify-center font-bold ${
                                  assignedShaft === shaftIdx
                                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                                    : 'bg-slate-900/60 text-slate-700'
                                }`}
                              >
                                {assignedShaft === shaftIdx ? '•' : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Lattice & Peg Plan (Lifting Matrix) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  2. Dobby Lattice / Peg Plan ({design.height} weft picks)
                </h4>
                <div className="bg-[#090b10] p-3 rounded-xl border border-slate-800 overflow-x-auto">
                  <div className="flex flex-col gap-1 min-w-[320px]">
                    {draftResult.pegPlanMatrix.map((pickPegs, pickIdx) => (
                      <div key={pickIdx} className="flex items-center gap-1">
                        <span className="w-14 text-[10px] font-mono text-slate-400 text-right pr-2">
                          Pick {pickIdx + 1}
                        </span>
                        <div className="flex gap-1">
                          {pickPegs.slice(0, Math.min(16, design.numShafts)).map((isPegged, sIdx) => (
                            <div
                              key={sIdx}
                              className={`w-5 h-5 rounded text-[9px] font-mono flex items-center justify-center font-bold ${
                                isPegged
                                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                                  : 'bg-slate-900/60 text-slate-700'
                              }`}
                            >
                              {isPegged ? 'P' : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="w-full max-w-3xl bg-[#11141f] rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4 overflow-y-auto max-h-[85vh]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-semibold text-white">Technical Weaving Error Analysis</h3>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {issues.length} technical checks evaluated
                </div>
              </div>

              {/* Float Statistics Bar */}
              <div className="grid grid-cols-4 gap-3 p-3 bg-[#0a0c12] rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Max Warp Float:</span>
                  <strong className="text-sm font-mono text-amber-300">
                    {floatStats.maxWarpFloat} picks
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Max Weft Float:</span>
                  <strong className="text-sm font-mono text-amber-300">
                    {floatStats.maxWeftFloat} ends
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Avg Warp Float:</span>
                  <strong className="text-sm font-mono text-slate-200">
                    {floatStats.avgWarpFloat}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Interlacements:</span>
                  <strong className="text-sm font-mono text-emerald-400">
                    {floatStats.interlacementCount}
                  </strong>
                </div>
              </div>

              {/* Issues List Cards */}
              <div className="space-y-3">
                {issues.map(issue => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-xl border ${
                      issue.severity === 'problem'
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : issue.severity === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {issue.severity === 'problem' ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : issue.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                    </div>

                    <p className="text-xs text-slate-300 mb-2">{issue.message}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] bg-black/20 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-400 font-semibold block">WHY IT MATTERS:</span>
                        <span className="text-slate-300">{issue.impact}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">POSSIBLE SOLUTION:</span>
                        <span className="text-amber-300">{issue.solution}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Repeat & Yarn Parameters */}
        <div className="lg:col-span-4 xl:col-span-3 bg-[#11141f] border-l border-slate-800 p-5 overflow-y-auto space-y-6">
          {/* Repeat System */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-amber-400" />
              Repeat Design Engine
            </label>

            {/* Repeat Type Selector */}
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Repeat Mode</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'straight', label: 'Straight' },
                    { id: 'mirror-h', label: 'Mirror Horizontal' },
                    { id: 'mirror-v', label: 'Mirror Vertical' },
                    { id: 'mirror-both', label: 'Mirror Both' },
                    { id: 'half-drop', label: 'Half-Drop' },
                    { id: 'alternate', label: 'Alternate' },
                  ] as { id: RepeatType; label: string }[]
                ).map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => onChange({ ...design, repeatType: mode.id })}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium text-left truncate transition-colors ${
                      design.repeatType === mode.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Repeat Multipliers */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Repeat Width</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {[1, 2, 3, 4].map(mx => (
                    <button
                      key={mx}
                      onClick={() => onChange({ ...design, repeatMultiplierX: mx })}
                      className={`flex-1 py-1 text-xs font-mono rounded ${
                        design.repeatMultiplierX === mx
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {mx}x
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1">Repeat Height</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {[1, 2, 3, 4].map(my => (
                    <button
                      key={my}
                      onClick={() => onChange({ ...design, repeatMultiplierY: my })}
                      className={`flex-1 py-1 text-xs font-mono rounded ${
                        design.repeatMultiplierY === my
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {my}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex justify-between">
              <span>Full Preview Ends × Picks:</span>
              <strong className="text-amber-300">
                {repeatMatrix[0]?.length} × {repeatMatrix.length}
              </strong>
            </div>
          </div>

          {/* Yarn Material Settings */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Yarn Specifications
            </label>

            {/* Warp Yarn */}
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Warp Yarn</span>
                <span className="text-slate-400 font-mono">{design.warpYarn.count}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['silk', 'cotton', 'zari', 'linen'] as YarnMaterial[]).map(mat => (
                  <button
                    key={mat}
                    onClick={() =>
                      onChange({
                        ...design,
                        warpYarn: { ...design.warpYarn, material: mat },
                      })
                    }
                    className={`py-1 text-[10px] uppercase font-bold rounded ${
                      design.warpYarn.material === mat
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            {/* Weft Yarn */}
            <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">Weft Yarn</span>
                <span className="text-slate-400 font-mono">{design.weftYarn.count}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['silk', 'cotton', 'zari', 'linen'] as YarnMaterial[]).map(mat => (
                  <button
                    key={mat}
                    onClick={() =>
                      onChange({
                        ...design,
                        weftYarn: { ...design.weftYarn, material: mat },
                      })
                    }
                    className={`py-1 text-[10px] uppercase font-bold rounded ${
                      design.weftYarn.material === mat
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Density (EPI/PPI) */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">EPI: {design.epi}</span>
              <span className="text-slate-400">PPI: {design.ppi}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Density Aspect Ratio:{' '}
              <strong className="text-amber-300 font-mono">
                {(design.ppi / design.epi).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
