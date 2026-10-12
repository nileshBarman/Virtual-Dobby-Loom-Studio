import React, { useState } from 'react';
import { Settings, X, Plus, Trash2, Check, Shield, Info, Sliders, Layers } from 'lucide-react';
import { LoomConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loomConfigs: LoomConfig[];
  activeLoomId: string;
  onSelectLoom: (id: string) => void;
  onSaveLoomConfigs: (configs: LoomConfig[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  loomConfigs,
  activeLoomId,
  onSelectLoom,
  onSaveLoomConfigs,
}) => {
  const [configs, setConfigs] = useState<LoomConfig[]>(loomConfigs);
  const [newProfileName, setNewProfileName] = useState<string>('');

  if (!isOpen) return null;

  const handleAddNew = () => {
    if (!newProfileName.trim()) return;
    const newConfig: LoomConfig = {
      id: `profile-${Date.now()}`,
      name: newProfileName.trim(),
      loomType: 'handloom-dobby',
      maxShafts: 16,
      defaultEPI: 48,
      defaultPPI: 48,
      reedDentsPerInch: 48,
      dentsPerDent: 2,
      notes: 'Custom calibrated handloom profile',
    };
    const updated = [...configs, newConfig];
    setConfigs(updated);
    onSaveLoomConfigs(updated);
    setNewProfileName('');
  };

  const handleDelete = (id: string) => {
    if (configs.length <= 1) return;
    const updated = configs.filter(c => c.id !== id);
    setConfigs(updated);
    onSaveLoomConfigs(updated);
    if (activeLoomId === id) {
      onSelectLoom(updated[0].id);
    }
  };

  const updateConfig = (id: string, updates: Partial<LoomConfig>) => {
    const updated = configs.map(c => (c.id === id ? { ...c, ...updates } : c));
    setConfigs(updated);
    onSaveLoomConfigs(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#121622] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#161a29]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Loom Calibration & Settings</h3>
              <p className="text-xs text-slate-400">
                Configure physical handloom shaft capacities, default reed counts, and workshop profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Add Profile */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. My Maheshwari Sunken Pit Loom..."
              value={newProfileName}
              onChange={e => setNewProfileName(e.target.value)}
              className="flex-1 bg-[#090b10] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <button
              onClick={handleAddNew}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Loom Profile</span>
            </button>
          </div>

          {/* List of profiles */}
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Calibrated Workshop Looms
            </span>

            {configs.map(cfg => {
              const isActive = cfg.id === activeLoomId;
              return (
                <div
                  key={cfg.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-[#181d2c] border-amber-500/60 shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-[#0e111a] border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectLoom(cfg.id)}
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isActive
                            ? 'border-amber-500 bg-amber-500 text-slate-950'
                            : 'border-slate-600 hover:border-amber-400'
                        }`}
                      >
                        {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span className="text-sm font-bold text-white">{cfg.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Active Profile
                        </span>
                      )}
                      {configs.length > 1 && (
                        <button
                          onClick={() => handleDelete(cfg.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Config fields */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1">Max Shafts:</span>
                      <select
                        value={cfg.maxShafts}
                        onChange={e => updateConfig(cfg.id, { maxShafts: Number(e.target.value) })}
                        className="w-full bg-[#090b10] border border-slate-800 rounded-lg p-1.5 text-slate-200"
                      >
                        {[4, 8, 12, 16, 20, 24, 32].map(n => (
                          <option key={n} value={n}>
                            {n} Shafts
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1">Loom Type:</span>
                      <select
                        value={cfg.loomType}
                        onChange={e => updateConfig(cfg.id, { loomType: e.target.value as any })}
                        className="w-full bg-[#090b10] border border-slate-800 rounded-lg p-1.5 text-slate-200"
                      >
                        <option value="handloom-dobby">Handloom Dobby</option>
                        <option value="pit-loom">Sunken Pit Loom</option>
                        <option value="frame-loom">Wooden Frame Loom</option>
                        <option value="barrel-dobby">Barrel Dobby</option>
                        <option value="electronic-dobby">Electronic Dobby</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1">Default EPI:</span>
                      <input
                        type="number"
                        value={cfg.defaultEPI}
                        onChange={e => updateConfig(cfg.id, { defaultEPI: Number(e.target.value) })}
                        className="w-full bg-[#090b10] border border-slate-800 rounded-lg p-1.5 text-slate-200 font-mono"
                      />
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px] mb-1">Default PPI:</span>
                      <input
                        type="number"
                        value={cfg.defaultPPI}
                        onChange={e => updateConfig(cfg.id, { defaultPPI: Number(e.target.value) })}
                        className="w-full bg-[#090b10] border border-slate-800 rounded-lg p-1.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Safety & Physical Notice */}
          <div className="p-4 bg-[#0e111a] rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Virtual fabric visualization is an approximation. Actual woven appearance can vary depending on loom setup,
              yarn properties, tension, reed, denting, finishing and weaving conditions. Always test critical designs on a
              physical sample before production.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#161a29] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
