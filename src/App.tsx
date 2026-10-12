import React, { useState, useEffect } from 'react';
import {
  DEFAULT_MAHESHWARI_DESIGN,
  INITIAL_DESIGNS,
  DEFAULT_LOOM_CONFIGS,
} from './data/defaultDesigns';
import { DobbyDesign, LoomConfig } from './types';
import { Navbar, AppView } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { DobbyStudio } from './editor/DobbyStudio';
import { LoomSimulatorView } from './simulator/LoomSimulatorView';
import { WeaveStructureView } from './components/WeaveStructureView';
import { SareeDesigner } from './components/SareeDesigner/SareeDesigner';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { SampleComparison } from './components/SampleComparison';
import { DesignLibrary } from './components/DesignLibrary';
import { LearningCenter } from './components/LearningCenter';
import { ExportCenter } from './components/ExportCenter';
import { AIAssistant } from './components/AIAssistant';
import { SettingsModal } from './components/SettingsModal';
import { createMatrix, cloneMatrix } from './weave-engine';

export default function App() {
  // Load saved designs or initialize with authentic handloom defaults
  const [designs, setDesigns] = useState<DobbyDesign[]>(() => {
    try {
      const saved = localStorage.getItem('virtual_dobby_designs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore parse error
    }
    return INITIAL_DESIGNS;
  });

  const [activeDesignId, setActiveDesignId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('virtual_dobby_active_id');
      if (savedId) return savedId;
    } catch {
      // Ignore
    }
    return DEFAULT_MAHESHWARI_DESIGN.id;
  });

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Loom Configuration Profiles
  const [loomConfigs, setLoomConfigs] = useState<LoomConfig[]>(() => {
    try {
      const saved = localStorage.getItem('virtual_dobby_looms');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return DEFAULT_LOOM_CONFIGS;
  });
  const [activeLoomId, setActiveLoomId] = useState<string>(DEFAULT_LOOM_CONFIGS[0].id);

  // Active design lookup
  const activeDesign =
    designs.find(d => d.id === activeDesignId) || designs[0] || DEFAULT_MAHESHWARI_DESIGN;

  // Persist designs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('virtual_dobby_designs_v1', JSON.stringify(designs));
      localStorage.setItem('virtual_dobby_active_id', activeDesignId);
    } catch (e) {
      console.warn('Failed to persist to localStorage', e);
    }
  }, [designs, activeDesignId]);

  // Persist loom profiles
  useEffect(() => {
    try {
      localStorage.setItem('virtual_dobby_looms', JSON.stringify(loomConfigs));
    } catch (e) {
      console.warn('Failed to persist loom configs', e);
    }
  }, [loomConfigs]);

  // Design Actions
  const handleUpdateDesign = (updated: DobbyDesign) => {
    setDesigns(prev => prev.map(d => (d.id === updated.id ? updated : d)));
  };

  const handleSelectDesign = (selected: DobbyDesign) => {
    setActiveDesignId(selected.id);
    setCurrentView('studio');
  };

  const handleDuplicateDesign = (source: DobbyDesign) => {
    const copy: DobbyDesign = {
      ...source,
      id: `design-${Date.now()}`,
      name: `${source.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      matrix: cloneMatrix(source.matrix),
    };
    setDesigns(prev => [copy, ...prev]);
    setActiveDesignId(copy.id);
  };

  const handleDeleteDesign = (id: string) => {
    if (designs.length <= 1) return;
    const remaining = designs.filter(d => d.id !== id);
    setDesigns(remaining);
    if (activeDesignId === id) {
      setActiveDesignId(remaining[0].id);
    }
  };

  const handleCreateNew = () => {
    const newDesign: DobbyDesign = {
      id: `new-dobby-${Date.now()}`,
      name: 'Untitled Dobby Weave',
      category: 'Motifs',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: 16,
      height: 16,
      matrix: createMatrix(16, 16, 0),
      repeatType: 'straight',
      repeatMultiplierX: 2,
      repeatMultiplierY: 2,
      warpColor: '#0e274a',
      weftColor: '#2d4a3e',
      zariColor: '#d9e2ec',
      bgColor: '#0d1117',
      warpYarn: { material: 'silk', count: '20/22D Silk', thickness: 2, twist: 'Z', luster: 0.8 },
      weftYarn: { material: 'cotton', count: '2/80s Cotton', thickness: 2.2, twist: 'S', luster: 0.4 },
      epi: 48,
      ppi: 48,
      numShafts: 16,
      draftingMethod: 'reduced',
      notes: 'New blank handloom dobby weave project.',
    };
    setDesigns(prev => [newDesign, ...prev]);
    setActiveDesignId(newDesign.id);
    setCurrentView('studio');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        designName={activeDesign.name}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 overflow-hidden pb-14 lg:pb-0">
        {currentView === 'dashboard' && (
          <Dashboard
            currentDesign={activeDesign}
            designs={designs}
            onNavigate={setCurrentView}
            onSelectDesign={handleSelectDesign}
            onCreateNew={handleCreateNew}
          />
        )}

        {currentView === 'studio' && (
          <DobbyStudio
            design={activeDesign}
            onChange={handleUpdateDesign}
            onSimulate={() => setCurrentView('simulator')}
            onOpenStructure={() => setCurrentView('structure')}
          />
        )}

        {currentView === 'simulator' && (
          <LoomSimulatorView
            design={activeDesign}
            onOpenStructure={() => setCurrentView('structure')}
          />
        )}

        {currentView === 'structure' && (
          <WeaveStructureView
            design={activeDesign}
            onChange={handleUpdateDesign}
            onOpenSimulator={() => setCurrentView('simulator')}
          />
        )}

        {currentView === 'saree' && (
          <SareeDesigner currentDesign={activeDesign} allDesigns={designs} />
        )}

        {currentView === 'whatif' && <WhatIfSimulator design={activeDesign} />}

        {currentView === 'calibration' && (
          <SampleComparison design={activeDesign} loomConfigs={loomConfigs} />
        )}

        {currentView === 'library' && (
          <DesignLibrary
            designs={designs}
            activeDesignId={activeDesignId}
            onSelectDesign={handleSelectDesign}
            onDuplicateDesign={handleDuplicateDesign}
            onDeleteDesign={handleDeleteDesign}
            onUpdateDesign={handleUpdateDesign}
            onCreateNew={handleCreateNew}
          />
        )}

        {currentView === 'learning' && <LearningCenter />}

        {currentView === 'export' && <ExportCenter design={activeDesign} />}

        {currentView === 'assistant' && <AIAssistant currentDesign={activeDesign} />}
      </main>

      {/* Loom Calibration & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        loomConfigs={loomConfigs}
        activeLoomId={activeLoomId}
        onSelectLoom={setActiveLoomId}
        onSaveLoomConfigs={setLoomConfigs}
      />
    </div>
  );
}
