import React, { useState } from 'react';
import {
  LayoutDashboard,
  Grid,
  Play,
  Eye,
  Layers,
  BookOpen,
  GraduationCap,
  Download,
  Settings,
  Bot,
  SlidersHorizontal,
  Camera,
  Menu,
  X
} from 'lucide-react';

export type AppView =
  | 'dashboard'
  | 'studio'
  | 'simulator'
  | 'structure'
  | 'saree'
  | 'library'
  | 'learning'
  | 'export'
  | 'whatif'
  | 'calibration'
  | 'assistant';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  designName: string;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  designName,
  onOpenSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'studio', label: 'Dobby Studio', icon: <Grid className="w-4 h-4" /> },
    { id: 'simulator', label: 'Virtual Loom', icon: <Play className="w-4 h-4 fill-current" /> },
    { id: 'structure', label: 'Fabric Preview', icon: <Eye className="w-4 h-4" /> },
    { id: 'saree', label: 'Saree Designer', icon: <Layers className="w-4 h-4" /> },
    { id: 'whatif', label: 'What-If', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'calibration', label: 'Sample Calibrate', icon: <Camera className="w-4 h-4" /> },
    { id: 'library', label: 'Dobby Book', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'learning', label: 'Learning Center', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Navbar */}
      <header className="h-14 bg-[#11141e] border-b border-slate-800/90 flex items-center justify-between px-4 z-40 sticky top-0 shrink-0">
        {/* Brand Logo & Active Design */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-950/40 group-hover:scale-105 transition-transform">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-white block font-sans">
                Virtual Dobby Studio
              </span>
              <span className="text-[10px] text-amber-400 font-mono block leading-none truncate max-w-[140px] sm:max-w-[200px]">
                {designName}
              </span>
            </div>
          </button>
        </div>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-0.5 bg-[#090b10] p-1 rounded-xl border border-slate-800">
          {navItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Settings & Mobile Menu Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors border border-slate-800"
            title="Loom Calibration & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2 text-slate-400 hover:text-white rounded-xl lg:hidden hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu (When Hamburger is clicked) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end p-4">
          <div className="bg-[#121622] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Studio Sections
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map(item => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-3 rounded-xl text-left text-xs font-semibold flex items-center gap-2 border transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg'
                        : 'bg-[#090b10] border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Persistent for quick thumb access on phones) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#11141e]/95 backdrop-blur-md border-t border-slate-800/90 flex items-center justify-around px-2 z-40">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center justify-center p-1 text-[10px] ${
            currentView === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('studio')}
          className={`flex flex-col items-center justify-center p-1 text-[10px] ${
            currentView === 'studio' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Studio</span>
        </button>

        {/* Center Floating Simulate Button */}
        <button
          onClick={() => onNavigate('simulator')}
          className="w-11 h-11 -mt-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-950/60 border-2 border-[#11141e]"
          title="Virtual Loom"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>

        <button
          onClick={() => onNavigate('structure')}
          className={`flex flex-col items-center justify-center p-1 text-[10px] ${
            currentView === 'structure' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Fabric</span>
        </button>

        <button
          onClick={() => onNavigate('saree')}
          className={`flex flex-col items-center justify-center p-1 text-[10px] ${
            currentView === 'saree' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Saree</span>
        </button>
      </div>
    </>
  );
};
