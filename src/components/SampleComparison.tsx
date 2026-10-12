import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Sliders, Check, Info, RefreshCw, FileText } from 'lucide-react';
import { DobbyDesign, LoomConfig } from '../types';
import { renderFabric } from '../fabric-renderer/renderFabric';
import { generateRepeat } from '../weave-engine';

interface SampleComparisonProps {
  design: DobbyDesign;
  loomConfigs: LoomConfig[];
  onSaveCalibrationProfile?: (profile: LoomConfig) => void;
}

export const SampleComparison: React.FC<SampleComparisonProps> = ({ design, loomConfigs }) => {
  const [sampleImageSrc, setSampleImageSrc] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100 split slider
  const [comparisonNotes, setComparisonNotes] = useState<string>(
    'Compared to handwoven sample: Physical handloom sample shows slightly higher beat-up tightness (approx. 52 PPI instead of 48). Silk sheen has slight golden warm cast under loom lamp.'
  );

  const [calibratedEPI, setCalibratedEPI] = useState<number>(design.epi);
  const [calibratedPPI, setCalibratedPPI] = useState<number>(design.ppi);
  const [beatUpTension, setBeatUpTension] = useState<'normal' | 'tight' | 'loose'>('tight');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render digital simulation canvas
  useEffect(() => {
    if (!simCanvasRef.current) return;
    const repeated = generateRepeat(design.matrix, design.repeatType, 2, 2);
    renderFabric(simCanvasRef.current, {
      matrix: repeated,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      zariColor: design.zariColor,
      bgColor: '#08090e',
      epi: calibratedEPI,
      ppi: calibratedPPI,
      zoom: 1.0,
      warpYarn: design.warpYarn,
      weftYarn: design.weftYarn,
      viewMode: 'fabric',
      showGridLines: false,
    });
  }, [design, calibratedEPI, calibratedPPI]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) {
          setSampleImageSrc(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0c12] text-slate-200 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-semibold text-white">Physical Handloom Sample Calibration</h2>
          <p className="text-xs text-slate-400">
            Compare browser simulation with photographs of real handwoven swatches to calibrate loom density
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Photo of Woven Sample</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Digital Simulation */}
        <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Digital Simulation (Procedural)
            </span>
            <span className="text-xs font-mono text-slate-400">
              EPI {calibratedEPI} • PPI {calibratedPPI}
            </span>
          </div>

          <div className="bg-[#08090e] rounded-xl p-4 border border-slate-800/80 flex items-center justify-center min-h-[300px] overflow-hidden">
            <canvas ref={simCanvasRef} className="rounded shadow-xl max-w-full" />
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-300 font-semibold block">Mathematical Geometry:</span>
            <p className="text-slate-400">
              Generated using exact shaft lifts, yarn counts ({design.warpYarn.count}), and 3D interlacement shadows.
            </p>
          </div>
        </div>

        {/* Right: Actual Physical Sample Photo */}
        <div className="bg-[#11141f] rounded-2xl border border-slate-800 p-5 shadow-2xl flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Actual Physical Swatch Photo
            </span>
            <span className="text-xs font-mono text-slate-400">
              {sampleImageSrc ? 'Photo Loaded' : 'No photo uploaded'}
            </span>
          </div>

          <div className="bg-[#08090e] rounded-xl p-4 border border-slate-800/80 flex items-center justify-center min-h-[300px] overflow-hidden">
            {sampleImageSrc ? (
              <img
                src={sampleImageSrc}
                alt="Actual Woven Sample"
                className="rounded shadow-xl max-h-[300px] object-contain"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 max-w-xs">
                  Upload a close-up smartphone photograph of your handloom swatch to compare thread density,
                  take-up shrinkage, and luster.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                >
                  Browse Image
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
            <span className="text-slate-300 font-semibold block">Physical Handloom Reality:</span>
            <p className="text-slate-400">
              Accounts for natural cotton slubs, reed wire marks, temple needle tension, and finishing wash shrinkage.
            </p>
          </div>
        </div>
      </div>

      {/* Loom Calibration Controls & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-[#11141f] rounded-2xl border border-slate-800 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Loom Calibration Controls
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Calibrated Reed EPI:</span>
                <span className="text-amber-400 font-mono">{calibratedEPI}</span>
              </div>
              <input
                type="range"
                min="24"
                max="96"
                value={calibratedEPI}
                onChange={e => setCalibratedEPI(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Calibrated Beat-up PPI:</span>
                <span className="text-amber-400 font-mono">{calibratedPPI}</span>
              </div>
              <input
                type="range"
                min="24"
                max="96"
                value={calibratedPPI}
                onChange={e => setCalibratedPPI(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Weaver Beat-Up Force:</span>
              <div className="grid grid-cols-3 gap-1">
                {(['loose', 'normal', 'tight'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setBeatUpTension(t)}
                    className={`py-1.5 rounded text-xs capitalize ${
                      beatUpTension === t
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-[#11141f] rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-amber-400" />
            Comparison & Calibration Notes
          </h3>
          <textarea
            rows={4}
            value={comparisonNotes}
            onChange={e => setComparisonNotes(e.target.value)}
            className="w-full bg-[#0a0c12] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            placeholder="Record observations regarding yarn crimp, reed marks, zari brightness, or beat-up firmness..."
          />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            <span>
              This calibration comparison is an engineering aid for visual tuning. Handloom weaving incorporates
              organic human variables that cannot be 100% physically duplicated without physical test swatches.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
