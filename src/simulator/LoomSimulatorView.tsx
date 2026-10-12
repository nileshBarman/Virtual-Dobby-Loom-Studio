import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, StepForward, StepBack, Gauge, Info, Layers, Eye } from 'lucide-react';
import { DobbyDesign } from '../types';
import { generateLoomDraft, generateRepeat } from '../weave-engine';
import { renderFabric } from '../fabric-renderer/renderFabric';

interface LoomSimulatorViewProps {
  design: DobbyDesign;
  onOpenStructure?: () => void;
}

export const LoomSimulatorView: React.FC<LoomSimulatorViewProps> = ({ design, onOpenStructure }) => {
  // Generate the composite repeat matrix for weaving simulation
  const repeatMatrix = generateRepeat(
    design.matrix,
    design.repeatType,
    design.repeatMultiplierX,
    design.repeatMultiplierY
  );

  const totalPicks = repeatMatrix.length;
  const totalWarpEnds = repeatMatrix[0]?.length || 0;

  // Derive loom draft and lifting plan
  const draftResult = generateLoomDraft(design.matrix, design.numShafts, design.draftingMethod);

  // Simulation playback state
  const [currentPick, setCurrentPick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 0.5x, 1x, 2x, 4x
  const [loomPerspective, setLoomPerspective] = useState<'front' | 'side' | 'isometric'>('isometric');

  // Animation cycle sub-phase (0: Shed Opening, 1: Shuttle Flying, 2: Reed Beating Up, 3: Completed)
  const [cycleProgress, setCycleProgress] = useState<number>(0);

  const fabricCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const loomCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Partial matrix containing only rows woven up to currentPick
  const wovenRowsCount = Math.max(1, Math.min(totalPicks, currentPick + 1));
  const partialMatrix = repeatMatrix.slice(0, wovenRowsCount);

  // Current active pick lifts
  const activePickIndex = currentPick % design.height;
  const liftedShafts = draftResult.liftingPlan[activePickIndex] || [];
  const liftedShaftIndices = liftedShafts
    .map((isLifted, idx) => (isLifted ? idx + 1 : null))
    .filter((v): v is number => v !== null);

  // Step pick forward
  const stepForward = useCallback(() => {
    setCurrentPick(prev => (prev + 1) % totalPicks);
    setCycleProgress(0);
  }, [totalPicks]);

  // Step pick backward
  const stepBackward = useCallback(() => {
    setCurrentPick(prev => (prev - 1 + totalPicks) % totalPicks);
    setCycleProgress(0);
  }, [totalPicks]);

  // Reset simulation
  const resetSimulation = () => {
    setIsPlaying(false);
    setCurrentPick(0);
    setCycleProgress(0);
  };

  // Keyboard shortcut for spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepForward, stepBackward]);

  // Animation Loop for Shuttle & Beater + Pick Progression
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const baseIntervalMs = 700 / speedMultiplier;

    const tick = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const elapsed = now - lastTimeRef.current;

      const progress = Math.min(1, elapsed / baseIntervalMs);
      setCycleProgress(progress);

      if (elapsed >= baseIntervalMs) {
        lastTimeRef.current = now;
        setCurrentPick(prev => (prev + 1) % totalPicks);
        setCycleProgress(0);
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier, totalPicks]);

  // Render Partial Fabric on Cloth Fell Canvas
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    renderFabric(fabricCanvasRef.current, {
      matrix: partialMatrix,
      warpColor: design.warpColor,
      weftColor: design.weftColor,
      zariColor: design.zariColor,
      bgColor: design.bgColor,
      epi: design.epi,
      ppi: design.ppi,
      zoom: 1.0,
      warpYarn: design.warpYarn,
      weftYarn: design.weftYarn,
      viewMode: 'fabric',
      showGridLines: false,
    });
  }, [partialMatrix, design]);

  // Render the Virtual Loom Mechanism Canvas (Shafts, Shed, Shuttle, Reed)
  useEffect(() => {
    const canvas = loomCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background Loom Frame Structure
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#10131c');
    bgGrad.addColorStop(1, '#080a0f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Shuttle direction oscillates with each pick
    const isL2R = currentPick % 2 === 0;
    // Shuttle position 0 (left) to 1 (right)
    let shuttleXRatio = 0.5;
    if (cycleProgress < 0.6) {
      const flightProgress = cycleProgress / 0.6;
      shuttleXRatio = isL2R ? flightProgress : 1 - flightProgress;
    } else {
      shuttleXRatio = isL2R ? 1 : 0;
    }

    // Reed beater angle (0 = back, 1 = forward strike against cloth fell)
    let reedStroke = 0;
    if (cycleProgress >= 0.6 && cycleProgress <= 0.9) {
      const beatProgress = (cycleProgress - 0.6) / 0.3;
      reedStroke = Math.sin(beatProgress * Math.PI); // back-forward-back punch
    }

    // Key Loom Coordinates
    const warpBeamY = 40;
    const healdShaftsY = 130;
    const reedPivotY = 230;
    const clothFellY = 280;
    const clothRollY = 370;

    const loomLeft = 60;
    const loomRight = width - 60;
    const loomWidth = loomRight - loomLeft;

    // 1. Draw Wooden Loom Uprights & Side Girders
    ctx.fillStyle = '#2b1b17';
    ctx.fillRect(loomLeft - 24, 20, 20, height - 40);
    ctx.fillRect(loomRight + 4, 20, 20, height - 40);
    ctx.fillStyle = '#3f2b23';
    ctx.fillRect(loomLeft - 22, 20, 4, height - 40);
    ctx.fillRect(loomRight + 6, 20, 4, height - 40);

    // Cross-beams
    ctx.fillStyle = '#231612';
    ctx.fillRect(loomLeft - 24, warpBeamY - 14, loomWidth + 48, 12);
    ctx.fillRect(loomLeft - 24, clothRollY + 14, loomWidth + 48, 14);

    // 2. Warp Beam (Back Roller)
    const beamGrad = ctx.createLinearGradient(0, warpBeamY - 12, 0, warpBeamY + 12);
    beamGrad.addColorStop(0, '#4a3227');
    beamGrad.addColorStop(0.5, '#785542');
    beamGrad.addColorStop(1, '#2b1b17');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.roundRect(loomLeft - 10, warpBeamY - 10, loomWidth + 20, 20, 6);
    ctx.fill();

    // 3. Heald Shafts / Harnesses
    const numShafts = Math.min(16, design.numShafts);
    const shaftSpacing = Math.min(12, 100 / numShafts);
    const baseShaftY = healdShaftsY;

    // Draw Shaft Frames
    for (let s = 0; s < numShafts; s++) {
      const isLifted = liftedShafts[s];
      // Shed opening height
      const liftElevation = isLifted ? -26 * Math.min(1, cycleProgress * 2.5) : 10;
      const sy = baseShaftY + s * (shaftSpacing * 0.4) + liftElevation;

      ctx.strokeStyle = isLifted ? '#eab308' : '#475569';
      ctx.lineWidth = isLifted ? 2.5 : 1.2;
      ctx.fillStyle = isLifted ? 'rgba(234, 179, 8, 0.15)' : 'rgba(71, 85, 105, 0.08)';

      // Shaft top & bottom wooden stave
      ctx.beginPath();
      ctx.roundRect(loomLeft + 15, sy - 15, loomWidth - 30, 30, 3);
      ctx.fill();
      ctx.stroke();

      // Shaft number label
      if (numShafts <= 16 && s % 2 === 0) {
        ctx.fillStyle = isLifted ? '#fef08a' : '#94a3b8';
        ctx.font = '9px monospace';
        ctx.fillText(`S${s + 1}`, loomLeft + 2, sy + 3);
      }
    }

    // 4. Stretched Warp Threads (from Warp Beam through Heald Eyes to Cloth Fell)
    const displayEndsCount = Math.min(48, totalWarpEnds);
    for (let i = 0; i < displayEndsCount; i++) {
      const endX = loomLeft + 20 + (i / (displayEndsCount - 1)) * (loomWidth - 40);
      const shaftIndex = draftResult.drafting[i % draftResult.drafting.length];
      const isEndLifted = liftedShafts[shaftIndex];

      const liftElevation = isEndLifted ? -26 * Math.min(1, cycleProgress * 2.5) : 10;
      const healdEyeY = baseShaftY + (shaftIndex % numShafts) * (shaftSpacing * 0.4) + liftElevation;

      // Color of warp thread
      ctx.strokeStyle = isEndLifted ? design.warpColor : adjustBrightness(design.warpColor, 0.65);
      ctx.lineWidth = isEndLifted ? 1.6 : 1.1;

      // Draw thread path: Beam -> Heald Eye -> Cloth Fell
      ctx.beginPath();
      ctx.moveTo(endX, warpBeamY + 10);
      ctx.lineTo(endX, healdEyeY);
      ctx.lineTo(endX, clothFellY);
      ctx.stroke();

      // Heald Eye Bead
      ctx.fillStyle = isEndLifted ? '#fbbf24' : '#64748b';
      ctx.beginPath();
      ctx.arc(endX, healdEyeY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Open Shed Shadow & Highlights
    ctx.fillStyle = 'rgba(234, 179, 8, 0.05)';
    ctx.beginPath();
    ctx.moveTo(loomLeft + 20, healdShaftsY - 25);
    ctx.lineTo(loomRight - 20, healdShaftsY - 25);
    ctx.lineTo(loomRight - 20, clothFellY);
    ctx.lineTo(loomLeft + 20, clothFellY);
    ctx.closePath();
    ctx.fill();

    // 6. Reed & Sley / Beater
    const reedBaseY = reedPivotY - reedStroke * 35;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(loomLeft + 10, reedBaseY - 18, loomWidth - 20, 24);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(loomLeft + 10, reedBaseY - 18, loomWidth - 20, 24);

    // Reed Dents (fine vertical metal wires)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1;
    for (let rx = loomLeft + 18; rx < loomRight - 18; rx += 8) {
      ctx.beginPath();
      ctx.moveTo(rx, reedBaseY - 16);
      ctx.lineTo(rx, reedBaseY + 4);
      ctx.stroke();
    }

    // 7. Flying Shuttle & Pirn Weft Trail
    const shuttleTrackY = healdShaftsY + 45;
    const shuttleActualX = loomLeft + 30 + shuttleXRatio * (loomWidth - 60);

    // Shuttle trailing weft thread
    ctx.strokeStyle = design.weftColor;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const trailStartX = isL2R ? loomLeft + 25 : loomRight - 25;
    ctx.moveTo(trailStartX, clothFellY);
    ctx.lineTo(shuttleActualX, shuttleTrackY);
    ctx.stroke();

    // Shuttle Body (Canoe-shaped polished wood)
    ctx.save();
    ctx.translate(shuttleActualX, shuttleTrackY);
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.quadraticCurveTo(-10, -7, 0, -8);
    ctx.quadraticCurveTo(10, -7, 22, 0);
    ctx.quadraticCurveTo(10, 7, 0, 8);
    ctx.quadraticCurveTo(-10, 7, -22, 0);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bobbin / Pirn cavity with weft wound yarn
    ctx.fillStyle = design.weftColor;
    ctx.beginPath();
    ctx.roundRect(-10, -4, 20, 8, 3);
    ctx.fill();

    // Shuttle tip metal points
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(isL2R ? 22 : -22, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 8. Cloth Fell (Where newly beaten pick locks into warp)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(loomLeft + 15, clothFellY);
    ctx.lineTo(loomRight - 15, clothFellY);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px sans-serif';
    ctx.fillText('CLOTH FELL', loomRight - 75, clothFellY - 5);

    // 9. Completed Woven Cloth Flowing to Breast Beam
    const wovenClothHeight = clothRollY - clothFellY;
    const clothGrad = ctx.createLinearGradient(0, clothFellY, 0, clothRollY);
    clothGrad.addColorStop(0, design.weftColor);
    clothGrad.addColorStop(0.3, design.warpColor);
    clothGrad.addColorStop(0.7, design.weftColor);
    clothGrad.addColorStop(1, design.warpColor);

    ctx.fillStyle = clothGrad;
    ctx.fillRect(loomLeft + 15, clothFellY, loomWidth - 30, wovenClothHeight);

    // Subtle horizontal pick lines on woven cloth
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    for (let cy = clothFellY + 4; cy < clothRollY; cy += 6) {
      ctx.beginPath();
      ctx.moveTo(loomLeft + 15, cy);
      ctx.lineTo(loomRight - 15, cy);
      ctx.stroke();
    }

    // 10. Front Cloth Roller (Take-up Beam)
    const rollGrad = ctx.createLinearGradient(0, clothRollY - 14, 0, clothRollY + 14);
    rollGrad.addColorStop(0, '#59392b');
    rollGrad.addColorStop(0.5, '#8c5943');
    rollGrad.addColorStop(1, '#3b251c');
    ctx.fillStyle = rollGrad;
    ctx.beginPath();
    ctx.roundRect(loomLeft - 8, clothRollY - 12, loomWidth + 16, 24, 8);
    ctx.fill();
    ctx.strokeStyle = '#231612';
    ctx.stroke();
  }, [
    currentPick,
    cycleProgress,
    design,
    draftResult,
    liftedShafts,
    totalWarpEnds,
    loomPerspective,
  ]);

  return (
    <div className="flex flex-col h-full bg-[#0b0d13] text-slate-200">
      {/* Top Simulator Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#141824] border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h2 className="text-base font-semibold text-white tracking-wide">Virtual Dobby Handloom</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
            EPI {design.epi} | PPI {design.ppi}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
            {design.numShafts} Shafts ({draftResult.minShaftsNeeded} Active)
          </span>
        </div>

        {/* Live Pick Counter HUD */}
        <div className="flex items-center gap-2 bg-[#090b10] px-4 py-2 rounded-lg border border-slate-700/60 shadow-inner">
          <span className="text-xs uppercase font-medium tracking-wider text-slate-400">Current Pick</span>
          <span className="text-lg font-bold font-mono text-amber-400">
            {currentPick + 1}
          </span>
          <span className="text-xs font-mono text-slate-500">/ {totalPicks}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={resetSimulation}
            title="Reset to Pick 1"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={stepBackward}
            title="Step Back 1 Pick (Left Arrow)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <StepBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(prev => !prev)}
            title="Play / Pause (Spacebar)"
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm shadow-md transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Simulate</span>
              </>
            )}
          </button>
          <button
            onClick={stepForward}
            title="Step Forward 1 Pick (Right Arrow)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 ml-2">
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-1 text-xs font-mono rounded ${
                  speedMultiplier === s
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Simulation Viewport (Split Grid: Left Loom Mechanism, Right Woven Cloth) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-y-auto">
        {/* Left Column: Handloom Mechanism Visualizer (Loom Stage) */}
        <div className="lg:col-span-7 flex flex-col bg-[#11141f] rounded-xl border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-slate-200">Interactive Handloom Stage</span>
            </div>

            {/* Shed Telemetry Indicator */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">
                Shed Motion:{' '}
                <span className="text-amber-300 font-mono">
                  {cycleProgress < 0.6 ? 'Shuttle Inserting Weft' : 'Reed Beat-Up'}
                </span>
              </span>
              <span className="text-slate-400">
                Shuttle Dir:{' '}
                <span className="text-sky-300 font-mono">
                  {currentPick % 2 === 0 ? 'Left → Right' : 'Right → Left'}
                </span>
              </span>
            </div>
          </div>

          {/* Loom Canvas */}
          <div className="relative flex-1 flex items-center justify-center bg-[#090b10] rounded-lg border border-slate-800/60 overflow-hidden min-h-[380px]">
            <canvas
              ref={loomCanvasRef}
              width={640}
              height={410}
              className="w-full h-full max-h-[460px] object-contain"
            />
          </div>

          {/* Lifted Shafts Bar for Current Pick */}
          <div className="mt-3 p-3 bg-[#0d1017] rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Lifted Shafts:</span>
              {liftedShaftIndices.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {liftedShaftIndices.map(shaftNum => (
                    <span
                      key={shaftNum}
                      className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-medium"
                    >
                      Shaft {shaftNum}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 italic">None (All shafts down)</span>
              )}
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Pick {activePickIndex + 1} of {design.height} in motif
            </div>
          </div>
        </div>

        {/* Right Column: Progressive Woven Fabric Growth (Cloth Fell Accumulator) */}
        <div className="lg:col-span-5 flex flex-col bg-[#11141f] rounded-xl border border-slate-800 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-slate-200">Woven Cloth Fell (Accumulating)</span>
            </div>
            {onOpenStructure && (
              <button
                onClick={onOpenStructure}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Inspect Weave Structure →
              </button>
            )}
          </div>

          {/* Dynamic Fabric Accumulator Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center bg-[#090b10] rounded-lg border border-slate-800/60 p-4 min-h-[320px] overflow-auto">
            <div className="relative shadow-2xl rounded border border-slate-700/50 overflow-hidden max-w-full">
              <canvas ref={fabricCanvasRef} className="block max-w-full h-auto" />
            </div>
            <div className="mt-3 text-xs text-slate-400 font-mono text-center">
              Woven: {wovenRowsCount} of {totalPicks} picks ({((wovenRowsCount / totalPicks) * 100).toFixed(0)}%)
            </div>
          </div>

          {/* Technical Specs & Loom Status Summary */}
          <div className="mt-4 p-3.5 bg-[#0e111a] rounded-lg border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between text-slate-400">
              <span>Warp Yarn:</span>
              <span className="text-slate-200 font-medium">
                {design.warpYarn.material.toUpperCase()} ({design.warpYarn.count})
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Weft Yarn:</span>
              <span className="text-slate-200 font-medium">
                {design.weftYarn.material.toUpperCase()} ({design.weftYarn.count})
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Reed Density:</span>
              <span className="text-slate-200 font-medium">
                {design.epi} ends/inch × {design.ppi} picks/inch
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Calculated Aspect:</span>
              <span className="text-amber-300 font-mono">
                {(design.ppi / design.epi).toFixed(2)}x {design.ppi === design.epi ? '(Square 1:1)' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Technical Notice */}
      <div className="p-3 bg-[#0c0e15] border-t border-slate-800 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
        <span>
          Virtual fabric visualization is an approximation. Actual woven appearance can vary depending on loom setup,
          yarn properties, tension, reed, denting, finishing and weaving conditions.
        </span>
      </div>
    </div>
  );
};

function adjustBrightness(hex: string, factor: number): string {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex, 16);
  const r = Math.min(255, Math.max(0, Math.round(((bigint >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((bigint >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((bigint & 255) * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}
