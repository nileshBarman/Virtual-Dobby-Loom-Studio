import React from 'react';
import {
  Play,
  Grid,
  Layers,
  BookOpen,
  GraduationCap,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  Sliders,
  Eye,
  Info,
  Heart,
  Palette
} from 'lucide-react';
import { DobbyDesign } from '../types';

interface DashboardProps {
  currentDesign: DobbyDesign;
  designs: DobbyDesign[];
  onNavigate: (
    view: 'dashboard' | 'studio' | 'simulator' | 'structure' | 'saree' | 'library' | 'learning' | 'export' | 'whatif' | 'calibration' | 'assistant'
  ) => void;
  onSelectDesign: (design: DobbyDesign) => void;
  onCreateNew: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentDesign,
  designs,
  onNavigate,
  onSelectDesign,
  onCreateNew,
}) => {
  const totalDesigns = designs.length;
  const savedMotifs = designs.filter(d => d.category === 'Motifs' || d.category === 'Butti').length;
  const savedBorders = designs.filter(d => d.category === 'Borders').length;

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 p-6 overflow-y-auto space-y-6">
      {/* Top Welcome & Continue Designing Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#171d2b] via-[#151c27] to-[#1a1523] border border-amber-500/25 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Virtual Dobby Handloom CAD Studio</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Virtual Dobby Loom Studio
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Mathematical weaving simulation and CAD for handloom weavers, textile designers, and students.
            Create dobby graphs, derive lifting plans, simulate heald shed motion, and inspect true 3D fabric
            interlacements before dressing the loom.
          </p>

          {/* Quick Continue Designing Callout */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('simulator')}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2.5 shadow-xl shadow-amber-950/50 transition-all hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>SIMULATE WEAVING NOW</span>
            </button>

            <button
              onClick={() => onNavigate('studio')}
              className="px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Grid className="w-4 h-4 text-amber-400" />
              <span>Edit "{currentDesign.name}"</span>
            </button>

            <button
              onClick={onCreateNew}
              className="px-4 py-3 rounded-xl bg-[#0e121a] hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center gap-2 border border-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>New Design</span>
            </button>
          </div>
        </div>

        {/* Decorative Loom Graphics / Motif Silhouette in Background */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400 via-transparent to-transparent flex items-center justify-center">
          <Layers className="w-72 h-72 text-amber-200" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Designs in Book</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalDesigns}</span>
            <span className="text-xs text-amber-400">Saved</span>
          </div>
        </div>

        <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase text-slate-400">Borders & Motifs</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-sky-400">{savedBorders + savedMotifs}</span>
            <span className="text-xs text-slate-400">Patterns</span>
          </div>
        </div>

        <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase text-slate-400">Current Loom Shafts</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{currentDesign.numShafts}</span>
            <span className="text-xs text-slate-400">Heald frames</span>
          </div>
        </div>

        <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-4 space-y-1">
          <span className="text-[11px] font-mono uppercase text-slate-400">Reed Density (EPI × PPI)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {currentDesign.epi}×{currentDesign.ppi}
            </span>
            <span className="text-xs text-slate-400">Density</span>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Studio Navigation & Tools
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Dobby Studio */}
          <div
            onClick={() => onNavigate('studio')}
            className="group p-5 bg-[#11141f] hover:bg-[#141824] rounded-2xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Grid className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Dobby Design Studio
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Interactive pixel grid canvas with pen, eraser, flood fill, symmetry mirroring, and image importer.
            </p>
          </div>

          {/* Card 2: Virtual Loom Simulator */}
          <div
            onClick={() => onNavigate('simulator')}
            className="group p-5 bg-[#11141f] hover:bg-[#141824] rounded-2xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              Virtual Loom Simulator
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Watch warp threads separate in the shed, heald shafts elevate, and the flying shuttle insert each weft pick.
            </p>
          </div>

          {/* Card 3: Fabric & Structure View */}
          <div
            onClick={() => onNavigate('structure')}
            className="group p-5 bg-[#11141f] hover:bg-[#141824] rounded-2xl border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
              Fabric & Structure Engine
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Toggle between Graph, 3D Yarn Cross-Section, and Realistic Woven Fabric with zoom from 50% to 800%.
            </p>
          </div>

          {/* Card 4: Saree Designer */}
          <div
            onClick={() => onNavigate('saree')}
            className="group p-5 bg-[#11141f] hover:bg-[#141824] rounded-2xl border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
              Traditional Saree Architect
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Architect complete 5.5m sarees: Body field with butti, top/bottom dobby borders, grand pallu, and blouse.
            </p>
          </div>

          {/* Card 5: Weaver Learning Center */}
          <div
            onClick={() => onNavigate('learning')}
            className="group p-5 bg-[#11141f] hover:bg-[#141824] rounded-2xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
              Weaver Learning Center
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Master dobby mechanisms, drafting plans, lattice pegging, EPI/PPI math, and float remediation.
            </p>
          </div>

          {/* Card 6: Design Library & Dobby Book */}
          <div
            onClick={() => onNavigate('library')}
            className="group p-5 bg-[#11141f] hover:bg-[#141824] rounded-2xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all shadow-lg hover:shadow-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
              Dobby Book Library
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Browse authentic preloaded handloom weaves: Maheshwari, Kanjivaram Temple, Chanderi, and Twills.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Designs Quick Access */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Designs in Studio
          </h3>
          <button
            onClick={() => onNavigate('library')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            View All in Dobby Book →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {designs.slice(0, 3).map(d => (
            <div
              key={d.id}
              onClick={() => onSelectDesign(d)}
              className="p-4 bg-[#11141f] rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  {d.category}
                </span>
                <h4 className="text-xs font-bold text-white line-clamp-1">{d.name}</h4>
                <span className="text-[11px] font-mono text-slate-400">
                  {d.width}×{d.height} • {d.numShafts} Shafts
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-3 h-3 rounded-full" style={{ background: d.warpColor }}></span>
                <span className="w-3 h-3 rounded-full" style={{ background: d.weftColor }}></span>
                <span className="w-3 h-3 rounded-full" style={{ background: d.zariColor }}></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="p-4 bg-[#0e111a] rounded-2xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          Virtual fabric visualization is an approximation. Actual woven appearance can vary depending on loom setup,
          yarn properties, tension, reed, denting, finishing and weaving conditions. Always test critical designs on a
          physical sample before production.
        </p>
      </div>
    </div>
  );
};
