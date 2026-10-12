import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Eye, RefreshCw, Copy, Sparkles, Layers } from 'lucide-react';
import { ComparisonVersion, DobbyDesign } from '../types';
import { renderFabric } from '../fabric-renderer/renderFabric';
import { generateRepeat } from '../weave-engine';

interface WhatIfSimulatorProps {
  design: DobbyDesign;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ design }) => {
  const [versions, setVersions] = useState<ComparisonVersion[]>([
    {
      id: 'v-a',
      label: 'Version A (Standard 48×48)',
      epi: design.epi,
      ppi: design.ppi,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      warpMaterial: design.warpYarn.material,
      weftMaterial: design.weftYarn.material,
      notes: 'Balanced standard beat-up, square motif geometry.',
    },
    {
      id: 'v-b',
      label: 'Version B (High Density Warp 60 EPI)',
      epi: Math.min(120, design.epi + 12),
      ppi: design.ppi,
      warpColor: design.warpColor,
      weftColor: '#1e293b', // Darker weft
      warpMaterial: 'silk',
      weftMaterial: 'cotton',
      notes: 'Warp-faced drape, horizontally compressed motifs.',
    },
    {
      id: 'v-c',
      label: 'Version C (Zari Weft Beat)',
      epi: design.epi,
      ppi: Math.max(24, design.ppi - 6),
      warpColor: design.warpColor,
      weftColor: '#f59e0b', // Gold Zari weft
      warpMaterial: 'silk',
      weftMaterial: 'zari',
      notes: 'Glittering metallic luster with slightly relaxed pick count.',
    },
  ]);

  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([null, null, null]);

  // Repeated matrix
  const repeatMatrix = generateRepeat(design.matrix, design.repeatType, 2, 2);

  // Render each version canvas
  useEffect(() => {
    versions.forEach((ver, idx) => {
      const canvas = canvasRefs.current[idx];
      if (!canvas) return;

      renderFabric(canvas, {
        matrix: repeatMatrix,
        warpColor: ver.warpColor,
        weftColor: ver.weftColor,
        zariColor: design.zariColor,
        bgColor: '#090b10',
        epi: ver.epi,
        ppi: ver.ppi,
        zoom: 0.85,
        warpYarn: { ...design.warpYarn, material: ver.warpMaterial },
        weftYarn: { ...design.weftYarn, material: ver.weftMaterial },
        viewMode: 'fabric',
        showGridLines: false,
      });
    });
  }, [versions, repeatMatrix, design]);

  const updateVersion = (index: number, updates: Partial<ComparisonVersion>) => {
    setVersions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-white">What-If Multi-Version Simulator</h2>
          <p className="text-xs text-slate-400">
            Compare multiple technical permutations of EPI, PPI, weft yarn, and density side-by-side
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
          Comparing 3 Live Variations
        </span>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {versions.map((ver, idx) => {
          const densityAspect = (ver.ppi / ver.epi).toFixed(2);
          return (
            <div
              key={ver.id}
              className="bg-[#11141f] rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <input
                  type="text"
                  value={ver.label}
                  onChange={e => updateVersion(idx, { label: e.target.value })}
                  className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b border-amber-500 truncate"
                />
              </div>

              {/* Fabric Simulation Canvas */}
              <div className="bg-[#08090e] rounded-xl p-3 border border-slate-800/80 flex items-center justify-center min-h-[220px] shadow-inner overflow-hidden">
                <canvas
                  ref={el => {
                    canvasRefs.current[idx] = el;
                  }}
                  className="rounded shadow-xl max-w-full"
                />
              </div>

              {/* Technical Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">EPI (Warp):</span>
                  <strong className="text-slate-200 font-mono">{ver.epi} ends/in</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">PPI (Weft):</span>
                  <strong className="text-slate-200 font-mono">{ver.ppi} picks/in</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Aspect Ratio:</span>
                  <strong className="text-amber-300 font-mono">{densityAspect}x</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Weft Material:</span>
                  <strong className="text-emerald-400 font-mono uppercase">{ver.weftMaterial}</strong>
                </div>
              </div>

              {/* Independent Tweak Sliders */}
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Tweak EPI:</span>
                    <span className="font-mono text-amber-400">{ver.epi}</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="96"
                    value={ver.epi}
                    onChange={e => updateVersion(idx, { epi: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Tweak PPI:</span>
                    <span className="font-mono text-amber-400">{ver.ppi}</span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="96"
                    value={ver.ppi}
                    onChange={e => updateVersion(idx, { ppi: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Weft Color:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={ver.weftColor}
                      onChange={e => updateVersion(idx, { weftColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-slate-300">{ver.weftColor}</span>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={ver.notes}
                    onChange={e => updateVersion(idx, { notes: e.target.value })}
                    placeholder="Weaving notes / observations..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
