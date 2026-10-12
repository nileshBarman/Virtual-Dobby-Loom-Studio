import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Heart,
  Copy,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  Upload
} from 'lucide-react';
import { DobbyDesign } from '../types';
import { renderFabric } from '../fabric-renderer/renderFabric';
import { generateRepeat } from '../weave-engine';

interface DesignLibraryProps {
  designs: DobbyDesign[];
  activeDesignId: string;
  onSelectDesign: (design: DobbyDesign) => void;
  onDuplicateDesign: (design: DobbyDesign) => void;
  onDeleteDesign: (id: string) => void;
  onUpdateDesign: (design: DobbyDesign) => void;
  onCreateNew: () => void;
}

const CATEGORIES = ['All', 'Borders', 'Butti', 'Motifs', 'Pallu', 'Experimental', 'Saved Samples'] as const;

export const DesignLibrary: React.FC<DesignLibraryProps> = ({
  designs,
  activeDesignId,
  onSelectDesign,
  onDuplicateDesign,
  onDeleteDesign,
  onUpdateDesign,
  onCreateNew,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');

  // Filter designs
  const filteredDesigns = designs.filter(d => {
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort designs
  filteredDesigns.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return b.width * b.height - a.width * a.height;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const toggleFavorite = (design: DobbyDesign, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateDesign({
      ...design,
      isFavorite: !design.isFavorite,
      updatedAt: new Date().toISOString(),
    });
  };

  const startRename = (design: DobbyDesign, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(design.id);
    setEditName(design.name);
  };

  const saveRename = (design: DobbyDesign) => {
    if (editName.trim()) {
      onUpdateDesign({
        ...design,
        name: editName.trim(),
        updatedAt: new Date().toISOString(),
      });
    }
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 p-6 overflow-y-auto space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Design Library / Dobby Book</h2>
            <p className="text-xs text-slate-400">
              Personal archive of handloom dobby graphs, lifting sequences, and woven fabric samples
            </p>
          </div>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Dobby Design</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#11141f] p-3 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, motif, or notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#090b10] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Sort:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-[#090b10] border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
          >
            <option value="date">Recent</option>
            <option value="name">Name</option>
            <option value="size">Grid Size</option>
          </select>
        </div>
      </div>

      {/* Designs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDesigns.map(design => (
          <DesignCard
            key={design.id}
            design={design}
            isActive={design.id === activeDesignId}
            isEditing={editingId === design.id}
            editName={editName}
            setEditName={setEditName}
            onSaveRename={() => saveRename(design)}
            onSelect={() => onSelectDesign(design)}
            onToggleFavorite={e => toggleFavorite(design, e)}
            onStartRename={e => startRename(design, e)}
            onDuplicate={e => {
              e.stopPropagation();
              onDuplicateDesign(design);
            }}
            onDelete={e => {
              e.stopPropagation();
              onDeleteDesign(design.id);
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Mini Card Component with Canvas Fabric Preview
interface DesignCardProps {
  design: DobbyDesign;
  isActive: boolean;
  isEditing: boolean;
  editName: string;
  setEditName: (v: string) => void;
  onSaveRename: () => void;
  onSelect: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onStartRename: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const DesignCard: React.FC<DesignCardProps> = ({
  design,
  isActive,
  isEditing,
  editName,
  setEditName,
  onSaveRename,
  onSelect,
  onToggleFavorite,
  onStartRename,
  onDuplicate,
  onDelete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const repeated = generateRepeat(design.matrix, design.repeatType, 2, 2);
    renderFabric(canvasRef.current, {
      matrix: repeated,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      zariColor: design.zariColor,
      bgColor: '#090b10',
      epi: design.epi,
      ppi: design.ppi,
      zoom: 0.65,
      warpYarn: design.warpYarn,
      weftYarn: design.weftYarn,
      viewMode: 'fabric',
      showGridLines: false,
    });
  }, [design]);

  return (
    <div
      onClick={onSelect}
      className={`group bg-[#11141f] rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
        isActive
          ? 'border-amber-500 shadow-xl shadow-amber-950/30 ring-1 ring-amber-500/50'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-xl'
      }`}
    >
      {/* Fabric Thumbnail Viewport */}
      <div className="relative h-44 bg-[#08090e] border-b border-slate-800 flex items-center justify-center p-3 overflow-hidden">
        <canvas ref={canvasRef} className="rounded shadow-lg max-h-full object-contain" />

        {/* Favorite Heart Button */}
        <button
          onClick={onToggleFavorite}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-slate-400 hover:text-rose-400 transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${design.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>

        {/* Category Badge */}
        <span className="absolute bottom-3 left-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-amber-400 font-mono">
          {design.category}
        </span>

        {/* Grid dimensions badge */}
        <span className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-slate-300">
          {design.width}×{design.height} • {design.numShafts} Shafts
        </span>
      </div>

      {/* Card Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {isEditing ? (
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                autoFocus
                className="bg-slate-900 border border-amber-500 rounded px-2 py-1 text-xs text-white w-full"
              />
              <button
                onClick={onSaveRename}
                className="p-1 rounded bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                {design.name}
              </h3>
              <button
                onClick={onStartRename}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                title="Rename Design"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{design.notes}</p>
        </div>

        {/* Color swatches & Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
          {/* Swatches */}
          <div className="flex items-center gap-1">
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
              style={{ background: design.warpColor }}
              title={`Warp: ${design.warpColor}`}
            ></span>
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
              style={{ background: design.weftColor }}
              title={`Weft: ${design.weftColor}`}
            ></span>
            <span
              className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
              style={{ background: design.zariColor }}
              title={`Zari: ${design.zariColor}`}
            ></span>
            <span className="text-[10px] font-mono text-slate-500 ml-1">
              EPI {design.epi} / PPI {design.ppi}
            </span>
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onDuplicate}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
              title="Duplicate Design"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10"
              title="Delete Design"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
