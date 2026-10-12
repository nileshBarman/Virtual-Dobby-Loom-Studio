import React, { useRef, useEffect } from 'react';
import { Download, Printer, FileText, Image as ImageIcon, Sparkles, Check, Layers } from 'lucide-react';
import { DobbyDesign } from '../types';
import { exportFabricImage, renderFabric } from '../fabric-renderer/renderFabric';
import { generateLoomDraft, generateRepeat } from '../weave-engine';

interface ExportCenterProps {
  design: DobbyDesign;
}

export const ExportCenter: React.FC<ExportCenterProps> = ({ design }) => {
  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const repeated = generateRepeat(design.matrix, design.repeatType, 2, 2);
  const draftResult = generateLoomDraft(design.matrix, design.numShafts, design.draftingMethod);

  useEffect(() => {
    // Render Fabric Preview Canvas
    if (fabricCanvasRef.current) {
      renderFabric(fabricCanvasRef.current, {
        matrix: repeated,
        warpColor: design.warpColor,
        weftColor: design.weftColor,
        zariColor: design.zariColor,
        bgColor: '#090b10',
        epi: design.epi,
        ppi: design.ppi,
        zoom: 1.0,
        warpYarn: design.warpYarn,
        weftYarn: design.weftYarn,
        viewMode: 'fabric',
        showGridLines: false,
      });
    }

    // Render Graph Canvas
    if (graphCanvasRef.current) {
      renderFabric(graphCanvasRef.current, {
        matrix: design.matrix,
        warpColor: design.warpColor,
        weftColor: design.weftColor,
        zariColor: design.zariColor,
        bgColor: '#161922',
        epi: 48,
        ppi: 48,
        zoom: 1.0,
        warpYarn: design.warpYarn,
        weftYarn: design.weftYarn,
        viewMode: 'graph',
        showGridLines: true,
      });
    }
  }, [design, repeated]);

  // Export Fabric PNG
  const downloadFabricPNG = () => {
    const dataUrl = exportFabricImage({
      matrix: repeated,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      zariColor: design.zariColor,
      bgColor: '#090b10',
      epi: design.epi,
      ppi: design.ppi,
      zoom: 2.0,
      warpYarn: design.warpYarn,
      weftYarn: design.weftYarn,
      viewMode: 'fabric',
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${design.name.toLowerCase().replace(/\s+/g, '-')}-fabric.png`;
    a.click();
  };

  // Export Graph PNG
  const downloadGraphPNG = () => {
    const dataUrl = exportFabricImage({
      matrix: design.matrix,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      zariColor: design.zariColor,
      bgColor: '#161922',
      epi: 48,
      ppi: 48,
      zoom: 2.0,
      warpYarn: design.warpYarn,
      weftYarn: design.weftYarn,
      viewMode: 'graph',
      showGridLines: true,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${design.name.toLowerCase().replace(/\s+/g, '-')}-graph.png`;
    a.click();
  };

  // Export Full JSON Project Backup
  const downloadJSONBackup = () => {
    const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${design.name.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white">Export Center & Weaver Specification Sheet</h2>
          <p className="text-xs text-slate-400">
            Generate high-resolution PNGs, JSON backups, and printable workshop technical sheets for master weavers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadJSONBackup}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Weaving Sheet (PDF)</span>
          </button>
        </div>
      </div>

      {/* Quick Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-[#11141f] rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">Fabric Preview Render</h4>
              <p className="text-xs text-slate-400">High-resolution 2X procedural textile PNG with realistic yarns</p>
            </div>
          </div>
          <button
            onClick={downloadFabricPNG}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
          >
            Download PNG
          </button>
        </div>

        <div className="p-4 bg-[#11141f] rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-sky-400" />
            <div>
              <h4 className="text-sm font-semibold text-white">Dobby Graph Paper</h4>
              <p className="text-xs text-slate-400">Crisp grid with coordinate boundaries for handloom pegging</p>
            </div>
          </div>
          <button
            onClick={downloadGraphPNG}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
          >
            Download PNG
          </button>
        </div>
      </div>

      {/* Printable Master Weaver Specification Sheet (A4 Layout) */}
      <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl space-y-6 max-w-4xl mx-auto print:p-0 print:shadow-none print:m-0 print:w-full">
        {/* Sheet Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
              VIRTUAL DOBBY LOOM STUDIO • TECHNICAL WEAVING SHEET
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{design.name}</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Category: {design.category} • Date: {new Date(design.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-slate-900 px-3 py-1 bg-slate-100 rounded border border-slate-300">
              {design.numShafts} SHAFT DOBBY
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">
              Active Shafts: {draftResult.minShaftsNeeded}
            </span>
          </div>
        </div>

        {/* Technical Parameters Table */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Warp Ends in Repeat:</span>
            <strong className="text-sm font-mono text-slate-900">{design.width} Ends</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Weft Picks in Repeat:</span>
            <strong className="text-sm font-mono text-slate-900">{design.height} Picks</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Ends Per Inch (EPI):</span>
            <strong className="text-sm font-mono text-slate-900">{design.epi}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Picks Per Inch (PPI):</span>
            <strong className="text-sm font-mono text-slate-900">{design.ppi}</strong>
          </div>
        </div>

        {/* Yarn Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <span className="font-bold text-slate-800 uppercase text-[11px] block">Warp Yarn Details:</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Material & Count:</span>
              <strong className="text-slate-800">{design.warpYarn.material.toUpperCase()} ({design.warpYarn.count})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Twist Direction:</span>
              <strong className="text-slate-800">{design.warpYarn.twist}-Twist</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Color Swatch:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-slate-400" style={{ background: design.warpColor }}></span>
                <span className="font-mono text-[11px]">{design.warpColor}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <span className="font-bold text-slate-800 uppercase text-[11px] block">Weft & Zari Details:</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Weft Count:</span>
              <strong className="text-slate-800">{design.weftYarn.material.toUpperCase()} ({design.weftYarn.count})</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Weft Color:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-slate-400" style={{ background: design.weftColor }}></span>
                <span className="font-mono text-[11px]">{design.weftColor}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Zari Accent:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded border border-slate-400" style={{ background: design.zariColor }}></span>
                <span className="font-mono text-[11px]">{design.zariColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Visual Plates: Left Graph, Right Fabric Simulation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Plate 1: Original Dobby Graph */}
          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Plate A: Dobby Weave Matrix ({design.width}×{design.height})
            </span>
            <div className="p-2 bg-white rounded border border-slate-300 shadow-sm max-w-full overflow-hidden">
              <canvas ref={graphCanvasRef} className="max-w-full h-auto block" />
            </div>
          </div>

          {/* Plate 2: Fabric Simulation Preview */}
          <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Plate B: Simulated Fabric Swatch
            </span>
            <div className="p-2 bg-white rounded border border-slate-300 shadow-sm max-w-full overflow-hidden">
              <canvas ref={fabricCanvasRef} className="max-w-full h-auto block" />
            </div>
          </div>
        </div>

        {/* Weaver Notes & Instructions */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <span className="font-bold text-slate-800 uppercase text-[11px] block">
            Weaver Notes & Denting Instructions:
          </span>
          <p className="text-slate-600 leading-relaxed">{design.notes}</p>
        </div>

        {/* Footer Sign-off Boxes */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-300 text-[11px] text-slate-500">
          <div>
            <span className="block border-t border-slate-400 pt-1 mt-6">Textile Designer Signature</span>
          </div>
          <div>
            <span className="block border-t border-slate-400 pt-1 mt-6">Master Weaver Verification</span>
          </div>
          <div>
            <span className="block border-t border-slate-400 pt-1 mt-6">Loom No. / Date Mounted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
