import { GridMatrix, YarnConfig } from '../types';

export interface FabricRenderOptions {
  matrix: GridMatrix;
  warpColor: string;
  weftColor: string;
  zariColor: string;
  bgColor: string;
  epi: number;
  ppi: number;
  zoom: number; // 0.5 to 8.0
  warpYarn: YarnConfig;
  weftYarn: YarnConfig;
  viewMode: 'graph' | 'structure' | 'fabric';
  highlightCell?: { r: number; c: number } | null;
  showGridLines?: boolean;
}

/**
 * Parses hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

/**
 * Adjusts color brightness
 */
function adjustBrightness(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Main procedural fabric renderer on HTML5 Canvas
 */
export function renderFabric(
  canvas: HTMLCanvasElement,
  options: FabricRenderOptions
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const {
    matrix,
    warpColor,
    weftColor,
    zariColor,
    bgColor,
    epi,
    ppi,
    zoom,
    warpYarn,
    weftYarn,
    viewMode,
    highlightCell,
    showGridLines = true,
  } = options;

  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  if (rows === 0 || cols === 0) return;

  // Base cell size (pixels per thread at 100% zoom and 50 EPI)
  const baseThreadSize = 16 * zoom;

  // Dimensional scaling based on EPI / PPI
  // e.g. standard 48 EPI / 48 PPI is 1.0 aspect
  const referenceDensity = 48;
  const cellWidth = Math.max(2, baseThreadSize * (referenceDensity / Math.max(12, epi)));
  const cellHeight = Math.max(2, baseThreadSize * (referenceDensity / Math.max(12, ppi)));

  const totalWidth = Math.ceil(cols * cellWidth);
  const totalHeight = Math.ceil(rows * cellHeight);

  // Set canvas internal dimensions
  if (canvas.width !== totalWidth || canvas.height !== totalHeight) {
    canvas.width = totalWidth;
    canvas.height = totalHeight;
  }

  // Clear background
  ctx.fillStyle = bgColor || '#12141c';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // ==========================================
  // MODE A: GRAPH PAPER VIEW
  // ==========================================
  if (viewMode === 'graph') {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        const x = c * cellWidth;
        const y = r * cellHeight;

        // Color coding
        if (val === 2) {
          ctx.fillStyle = zariColor; // Zari
        } else if (val === 1) {
          ctx.fillStyle = warpColor; // Warp up
        } else {
          ctx.fillStyle = '#1e2433'; // Weft down (graph grid field)
        }
        ctx.fillRect(x, y, cellWidth, cellHeight);

        // Subtle grid lines
        if (showGridLines && cellWidth >= 6) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        }
      }
    }
  }

  // ==========================================
  // MODE B: WEAVE STRUCTURE VIEW
  // (Interlacement Cross-Section & Schematic Threads)
  // ==========================================
  else if (viewMode === 'structure') {
    // Render schematic threads with clear over/under layering and 3D borders
    const threadRadiusX = cellWidth * 0.42;
    const threadRadiusY = cellHeight * 0.42;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        const x = c * cellWidth;
        const y = r * cellHeight;
        const cx = x + cellWidth / 2;
        const cy = y + cellHeight / 2;

        const isWarpUp = val >= 1;
        const activeWarpColor = val === 2 ? zariColor : warpColor;

        if (isWarpUp) {
          // WEFT PASSES UNDERNEATH (Background slot)
          ctx.fillStyle = adjustBrightness(weftColor, 0.6);
          ctx.fillRect(x, cy - threadRadiusY * 0.8, cellWidth, threadRadiusY * 1.6);

          // Shadow cast by warp onto recessed weft
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(cx - threadRadiusX - 2, y, (threadRadiusX + 2) * 2, cellHeight);

          // WARP THREAD ON TOP
          ctx.fillStyle = activeWarpColor;
          ctx.beginPath();
          ctx.ellipse(cx, cy, threadRadiusX, threadRadiusY * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();

          // Warp crown highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.ellipse(cx, cy, threadRadiusX * 0.35, threadRadiusY * 0.9, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // WARP PASSES UNDERNEATH (Background slot)
          ctx.fillStyle = adjustBrightness(activeWarpColor, 0.6);
          ctx.fillRect(cx - threadRadiusX * 0.8, y, threadRadiusX * 1.6, cellHeight);

          // Shadow cast by weft onto recessed warp
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(x, cy - threadRadiusY - 2, cellWidth, (threadRadiusY + 2) * 2);

          // WEFT THREAD ON TOP
          ctx.fillStyle = weftColor;
          ctx.beginPath();
          ctx.ellipse(cx, cy, threadRadiusX * 1.15, threadRadiusY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Weft crown highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.ellipse(cx, cy, threadRadiusX * 0.9, threadRadiusY * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Interlacement marker dot
        if (cellWidth >= 16) {
          ctx.fillStyle = isWarpUp ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.4)';
          ctx.beginPath();
          ctx.arc(cx, cy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // ==========================================
  // MODE C: REALISTIC WOVEN FABRIC VIEW
  // Procedural continuous yarn simulation with 3D cylindrical lighting,
  // Zari metallic reflections, yarn twists, and interlacement depth!
  // ==========================================
  else {
    // 1. Draw Underlying Weave Recesses (Bottom Layer)
    // Draw all recessed weft thread segments first
    for (let r = 0; r < rows; r++) {
      const y = r * cellHeight;
      const cy = y + cellHeight / 2;
      const threadThicknessY = cellHeight * 0.92;

      // Weft base stroke
      const grad = ctx.createLinearGradient(0, cy - threadThicknessY / 2, 0, cy + threadThicknessY / 2);
      grad.addColorStop(0, adjustBrightness(weftColor, 0.4));
      grad.addColorStop(0.5, adjustBrightness(weftColor, 0.85));
      grad.addColorStop(1, adjustBrightness(weftColor, 0.35));

      ctx.fillStyle = grad;
      ctx.fillRect(0, cy - threadThicknessY / 2, totalWidth, threadThicknessY);
    }

    // 2. Draw Recessed Warp Threads (running vertically)
    for (let c = 0; c < cols; c++) {
      const x = c * cellWidth;
      const cx = x + cellWidth / 2;
      const threadThicknessX = cellWidth * 0.92;

      const grad = ctx.createLinearGradient(cx - threadThicknessX / 2, 0, cx + threadThicknessX / 2, 0);
      grad.addColorStop(0, adjustBrightness(warpColor, 0.38));
      grad.addColorStop(0.5, adjustBrightness(warpColor, 0.8));
      grad.addColorStop(1, adjustBrightness(warpColor, 0.32));

      ctx.fillStyle = grad;
      ctx.fillRect(cx - threadThicknessX / 2, 0, threadThicknessX, totalHeight);
    }

    // 3. Render Top Floating Threads with 3D Occlusion and Shadowing
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        const x = c * cellWidth;
        const y = r * cellHeight;
        const cx = x + cellWidth / 2;
        const cy = y + cellHeight / 2;

        const isWarpUp = val >= 1;
        const isZari = val === 2;
        const activeColor = isZari ? zariColor : isWarpUp ? warpColor : weftColor;

        if (isWarpUp) {
          // WARP IS ON TOP: Float vertically
          const wThread = cellWidth * 0.96;
          const leftX = cx - wThread / 2;

          // Shadow cast underneath warp onto recessed weft
          ctx.fillStyle = 'rgba(5, 7, 12, 0.55)';
          ctx.fillRect(leftX - 1.5, y, wThread + 3, cellHeight);

          // Warp cylindrical yarn gradient
          const warpGrad = ctx.createLinearGradient(leftX, 0, leftX + wThread, 0);
          if (isZari) {
            // Metallic Gold/Silver Shimmer with intense highlight bands
            warpGrad.addColorStop(0, adjustBrightness(activeColor, 0.55));
            warpGrad.addColorStop(0.3, adjustBrightness(activeColor, 1.2));
            warpGrad.addColorStop(0.5, '#ffffff'); // Glint
            warpGrad.addColorStop(0.7, adjustBrightness(activeColor, 1.15));
            warpGrad.addColorStop(1, adjustBrightness(activeColor, 0.45));
          } else if (warpYarn.material === 'silk') {
            warpGrad.addColorStop(0, adjustBrightness(activeColor, 0.45));
            warpGrad.addColorStop(0.4, adjustBrightness(activeColor, 1.25));
            warpGrad.addColorStop(0.55, adjustBrightness(activeColor, 1.1));
            warpGrad.addColorStop(1, adjustBrightness(activeColor, 0.4));
          } else {
            // Cotton matte
            warpGrad.addColorStop(0, adjustBrightness(activeColor, 0.55));
            warpGrad.addColorStop(0.5, adjustBrightness(activeColor, 1.05));
            warpGrad.addColorStop(1, adjustBrightness(activeColor, 0.5));
          }

          ctx.fillStyle = warpGrad;
          ctx.fillRect(leftX, y, wThread, cellHeight);

          // Micro-fiber twists / yarn striations at high zoom
          if (zoom >= 2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(cx - 1, y, 2, cellHeight);

            if (zoom >= 4) {
              // Diagonal twist ridges
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
              ctx.lineWidth = 1;
              const twistStep = Math.max(4, cellHeight * 0.3);
              for (let ty = y; ty < y + cellHeight; ty += twistStep) {
                ctx.beginPath();
                ctx.moveTo(leftX, ty);
                ctx.lineTo(leftX + wThread, ty + 2.5);
                ctx.stroke();
              }
            }
          }
        } else {
          // WEFT IS ON TOP: Float horizontally
          const hThread = cellHeight * 0.96;
          const topY = cy - hThread / 2;

          // Shadow cast underneath weft onto recessed warp
          ctx.fillStyle = 'rgba(5, 7, 12, 0.55)';
          ctx.fillRect(x, topY - 1.5, cellWidth, hThread + 3);

          // Weft cylindrical yarn gradient
          const weftGrad = ctx.createLinearGradient(0, topY, 0, topY + hThread);
          if (weftYarn.material === 'silk') {
            weftGrad.addColorStop(0, adjustBrightness(activeColor, 0.45));
            weftGrad.addColorStop(0.4, adjustBrightness(activeColor, 1.25));
            weftGrad.addColorStop(0.55, adjustBrightness(activeColor, 1.1));
            weftGrad.addColorStop(1, adjustBrightness(activeColor, 0.4));
          } else {
            weftGrad.addColorStop(0, adjustBrightness(activeColor, 0.55));
            weftGrad.addColorStop(0.5, adjustBrightness(activeColor, 1.05));
            weftGrad.addColorStop(1, adjustBrightness(activeColor, 0.5));
          }

          ctx.fillStyle = weftGrad;
          ctx.fillRect(x, topY, cellWidth, hThread);

          // Micro-fiber twists at high zoom
          if (zoom >= 2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(x, cy - 1, cellWidth, 2);

            if (zoom >= 4) {
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
              ctx.lineWidth = 1;
              const twistStep = Math.max(4, cellWidth * 0.3);
              for (let tx = x; tx < x + cellWidth; tx += twistStep) {
                ctx.beginPath();
                ctx.moveTo(tx, topY);
                ctx.lineTo(tx + 2.5, topY + hThread);
                ctx.stroke();
              }
            }
          }
        }
      }
    }
  }

  // Active / Selected Cell Highlight HUD
  if (highlightCell) {
    const hx = highlightCell.c * cellWidth;
    const hy = highlightCell.r * cellHeight;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(hx + 1, hy + 1, cellWidth - 2, cellHeight - 2);
  }
}

/**
 * Exports canvas to high-res data URL
 */
export function exportFabricImage(
  options: FabricRenderOptions,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): string {
  const offscreen = document.createElement('canvas');
  renderFabric(offscreen, options);
  return offscreen.toDataURL(format, 0.95);
}
