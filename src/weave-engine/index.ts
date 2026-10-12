import { DraftingMethod, DraftingResult, GridMatrix, RepeatType, WeavingIssue } from '../types';

/**
 * Creates a blank matrix of size height (picks) x width (warp ends)
 */
export function createMatrix(width: number, height: number, defaultValue: number = 0): GridMatrix {
  const matrix: GridMatrix = [];
  for (let r = 0; r < height; r++) {
    matrix.push(new Array(width).fill(defaultValue));
  }
  return matrix;
}

/**
 * Deep clones a matrix
 */
export function cloneMatrix(matrix: GridMatrix): GridMatrix {
  return matrix.map(row => [...row]);
}

/**
 * Inverts matrix (0 becomes 1, 1 becomes 0)
 */
export function invertMatrix(matrix: GridMatrix): GridMatrix {
  return matrix.map(row => row.map(cell => (cell === 0 ? 1 : 0)));
}

/**
 * Mirror horizontally (left-right flip)
 */
export function mirrorHorizontal(matrix: GridMatrix): GridMatrix {
  return matrix.map(row => [...row].reverse());
}

/**
 * Mirror vertically (up-down flip)
 */
export function mirrorVertical(matrix: GridMatrix): GridMatrix {
  return [...matrix].reverse().map(row => [...row]);
}

/**
 * Rotate 90 degrees clockwise
 */
export function rotateMatrix90(matrix: GridMatrix): GridMatrix {
  const h = matrix.length;
  const w = matrix[0]?.length || 0;
  const res = createMatrix(h, w, 0);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      res[c][h - 1 - r] = matrix[r][c];
    }
  }
  return res;
}

/**
 * Shift matrix cyclically
 */
export function shiftMatrix(matrix: GridMatrix, deltaX: number, deltaY: number): GridMatrix {
  const h = matrix.length;
  const w = matrix[0]?.length || 0;
  if (h === 0 || w === 0) return matrix;

  const res = createMatrix(w, h, 0);
  for (let r = 0; r < h; r++) {
    const newR = ((r + deltaY) % h + h) % h;
    for (let c = 0; c < w; c++) {
      const newC = ((c + deltaX) % w + w) % w;
      res[newR][newC] = matrix[r][c];
    }
  }
  return res;
}

/**
 * Flood Fill algorithm for bucket tool
 */
export function floodFill(
  matrix: GridMatrix,
  startRow: number,
  startCol: number,
  fillVal: number
): GridMatrix {
  const h = matrix.length;
  const w = matrix[0]?.length || 0;
  if (startRow < 0 || startRow >= h || startCol < 0 || startCol >= w) return matrix;

  const targetVal = matrix[startRow][startCol];
  if (targetVal === fillVal) return matrix;

  const res = cloneMatrix(matrix);
  const queue: [number, number][] = [[startRow, startCol]];
  res[startRow][startCol] = fillVal;

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < h && nc >= 0 && nc < w && res[nr][nc] === targetVal) {
        res[nr][nc] = fillVal;
        queue.push([nr, nc]);
      }
    }
  }

  return res;
}

/**
 * Repeat Design Engine: Combines repeat modes & multipliers
 */
export function generateRepeat(
  matrix: GridMatrix,
  repeatType: RepeatType = 'straight',
  multX: number = 2,
  multY: number = 2
): GridMatrix {
  const h = matrix.length;
  const w = matrix[0]?.length || 0;
  if (h === 0 || w === 0) return matrix;

  const totalW = w * multX;
  const totalH = h * multY;
  const result = createMatrix(totalW, totalH, 0);

  // Pre-generate mirrored tiles if needed
  const mirrorHTile = mirrorHorizontal(matrix);
  const mirrorVTile = mirrorVertical(matrix);
  const mirrorBothTile = mirrorVertical(mirrorHTile);

  for (let blockY = 0; blockY < multY; blockY++) {
    for (let blockX = 0; blockX < multX; blockX++) {
      let activeTile = matrix;

      if (repeatType === 'mirror-h') {
        activeTile = blockX % 2 === 1 ? mirrorHTile : matrix;
      } else if (repeatType === 'mirror-v') {
        activeTile = blockY % 2 === 1 ? mirrorVTile : matrix;
      } else if (repeatType === 'mirror-both') {
        const isXOdd = blockX % 2 === 1;
        const isYOdd = blockY % 2 === 1;
        if (!isXOdd && !isYOdd) activeTile = matrix;
        else if (isXOdd && !isYOdd) activeTile = mirrorHTile;
        else if (!isXOdd && isYOdd) activeTile = mirrorVTile;
        else activeTile = mirrorBothTile;
      } else if (repeatType === 'alternate') {
        // Inverted interlacement on alternate tiles
        activeTile = (blockX + blockY) % 2 === 1 ? invertMatrix(matrix) : matrix;
      }

      // Half-drop repeat calculation: shift odd columns by half height
      const yOffset = repeatType === 'half-drop' && blockX % 2 === 1 ? Math.floor(h / 2) : 0;

      for (let r = 0; r < h; r++) {
        const targetRow = (blockY * h + r + yOffset) % totalH;
        for (let c = 0; c < w; c++) {
          const targetCol = blockX * w + c;
          result[targetRow][targetCol] = activeTile[r][c];
        }
      }
    }
  }

  return result;
}

/**
 * Computes Loom Drafting Plan and Lifting (Peg/Lattice) Plan
 */
export function generateLoomDraft(
  matrix: GridMatrix,
  numShafts: number = 16,
  method: DraftingMethod = 'reduced'
): DraftingResult {
  const h = matrix.length; // picks
  const w = matrix[0]?.length || 0; // warp ends

  if (h === 0 || w === 0) {
    return {
      drafting: [],
      liftingPlan: [],
      pegPlanMatrix: [],
      minShaftsNeeded: 0,
      capacityExceeded: false,
      uniquePatternsCount: 0,
    };
  }

  // Determine unique column signatures (warp movement across all picks)
  const colSignatures: string[] = [];
  const uniqueSignaturesMap = new Map<string, number>();
  const uniqueSignaturesList: string[] = [];

  for (let c = 0; c < w; c++) {
    let sig = '';
    for (let r = 0; r < h; r++) {
      sig += matrix[r][c];
    }
    colSignatures.push(sig);

    if (!uniqueSignaturesMap.has(sig)) {
      uniqueSignaturesMap.set(sig, uniqueSignaturesList.length);
      uniqueSignaturesList.push(sig);
    }
  }

  const minShaftsNeeded = uniqueSignaturesList.length;
  const capacityExceeded = minShaftsNeeded > numShafts;

  const drafting: number[] = new Array(w).fill(0);

  if (method === 'reduced') {
    // Reduced drafting (minimum shaft allocation)
    for (let c = 0; c < w; c++) {
      const sig = colSignatures[c];
      const shaftIdx = uniqueSignaturesMap.get(sig)!;
      drafting[c] = shaftIdx % numShafts;
    }
  } else if (method === 'straight') {
    // Straight drafting: end 0 -> shaft 0, end 1 -> shaft 1, etc.
    for (let c = 0; c < w; c++) {
      drafting[c] = c % numShafts;
    }
  } else if (method === 'point') {
    // Point drafting: 0, 1, ..., N-1, N-2, ..., 1
    const cycleLen = Math.max(2, 2 * numShafts - 2);
    for (let c = 0; c < w; c++) {
      const step = c % cycleLen;
      drafting[c] = step < numShafts ? step : cycleLen - step;
    }
  } else {
    // Skip drafting
    for (let c = 0; c < w; c++) {
      drafting[c] = (c * 2) % numShafts;
    }
  }

  // Derive Lifting Plan / Lattice Peg Plan for each pick and shaft
  // A shaft is lifted on pick `r` if the warp ends assigned to it are lifted (value 1)
  const liftingPlan: boolean[][] = [];
  const pegPlanMatrix: number[][] = [];

  for (let r = 0; r < h; r++) {
    const rowLifts = new Array(numShafts).fill(false);
    const rowPegs = new Array(numShafts).fill(0);

    for (let c = 0; c < w; c++) {
      const s = drafting[c];
      if (matrix[r][c] >= 1) {
        rowLifts[s] = true;
        rowPegs[s] = 1;
      }
    }

    liftingPlan.push(rowLifts);
    pegPlanMatrix.push(rowPegs);
  }

  return {
    drafting,
    liftingPlan,
    pegPlanMatrix,
    minShaftsNeeded,
    capacityExceeded,
    uniquePatternsCount: minShaftsNeeded,
  };
}

/**
 * Calculates float statistics (max warp float, max weft float)
 */
export function calculateFloats(matrix: GridMatrix): {
  maxWarpFloat: number;
  maxWeftFloat: number;
  avgWarpFloat: number;
  avgWeftFloat: number;
  interlacementCount: number;
} {
  const h = matrix.length;
  const w = matrix[0]?.length || 0;
  if (h === 0 || w === 0) {
    return { maxWarpFloat: 0, maxWeftFloat: 0, avgWarpFloat: 0, avgWeftFloat: 0, interlacementCount: 0 };
  }

  let maxWarpFloat = 0;
  let maxWeftFloat = 0;
  let totalWarpFloats = 0;
  let warpFloatCount = 0;
  let totalWeftFloats = 0;
  let weftFloatCount = 0;
  let interlacementCount = 0;

  // Weft floats (consecutive 0s in row, wrapping across repeat)
  for (let r = 0; r < h; r++) {
    // duplicate row to check wrap-around float
    const extendedRow = [...matrix[r], ...matrix[r]];
    let current0 = 0;
    for (let i = 0; i < extendedRow.length; i++) {
      if (extendedRow[i] === 0) {
        current0++;
        if (current0 > maxWeftFloat) maxWeftFloat = current0;
      } else {
        if (current0 > 0 && i < w + current0) {
          totalWeftFloats += current0;
          weftFloatCount++;
        }
        current0 = 0;
      }
    }
  }

  // Warp floats (consecutive 1s in column, wrapping across repeat)
  for (let c = 0; c < w; c++) {
    const col: number[] = [];
    for (let r = 0; r < h; r++) col.push(matrix[r][c]);
    const extendedCol = [...col, ...col];
    let current1 = 0;
    for (let i = 0; i < extendedCol.length; i++) {
      if (extendedCol[i] >= 1) {
        current1++;
        if (current1 > maxWarpFloat) maxWarpFloat = current1;
      } else {
        if (current1 > 0 && i < h + current1) {
          totalWarpFloats += current1;
          warpFloatCount++;
        }
        current1 = 0;
      }
    }
  }

  // Count interlacements (transitions between 0 and 1)
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const nextC = (c + 1) % w;
      if (matrix[r][c] !== matrix[r][nextC]) interlacementCount++;
      const nextR = (r + 1) % h;
      if (matrix[r][c] !== matrix[nextR][c]) interlacementCount++;
    }
  }

  // Cap max floats to repeat dimensions so wrapped counters don't exceed size
  maxWarpFloat = Math.min(maxWarpFloat, h);
  maxWeftFloat = Math.min(maxWeftFloat, w);

  return {
    maxWarpFloat,
    maxWeftFloat,
    avgWarpFloat: warpFloatCount > 0 ? parseFloat((totalWarpFloats / warpFloatCount).toFixed(1)) : 0,
    avgWeftFloat: weftFloatCount > 0 ? parseFloat((totalWeftFloats / weftFloatCount).toFixed(1)) : 0,
    interlacementCount,
  };
}

/**
 * Comprehensive Weaving Error & Structural Integrity Checker
 */
export function validateDesign(
  matrix: GridMatrix,
  epi: number,
  ppi: number,
  numShafts: number
): WeavingIssue[] {
  const issues: WeavingIssue[] = [];
  const h = matrix.length;
  const w = matrix[0]?.length || 0;

  if (h === 0 || w === 0) return issues;

  // 1. Shaft Capacity Check
  const draftResult = generateLoomDraft(matrix, numShafts, 'reduced');
  if (draftResult.capacityExceeded) {
    issues.push({
      id: 'issue-shaft-capacity',
      type: 'shaft-capacity',
      severity: 'problem',
      title: 'Shaft Capacity Exceeded',
      message: `Design requires ${draftResult.minShaftsNeeded} unique heald shafts, but the loom is configured for ${numShafts} shafts.`,
      location: `Warp repeat (${w} ends)`,
      impact: 'Cannot be woven on this loom without modifying the motif symmetry, reducing colors, or switching to a Jacquard loom.',
      solution: `Increase loom shaft capacity in settings, or simplify motif repeats to stay within ${numShafts} shafts.`,
    });
  } else {
    issues.push({
      id: 'ok-shafts',
      type: 'shaft-capacity',
      severity: 'ok',
      title: 'Shaft Capacity Valid',
      message: `Fits within capacity: uses ${draftResult.minShaftsNeeded} of ${numShafts} available shafts.`,
      location: 'Full draft',
      impact: 'Feasible for handloom dobby lattice mounting.',
      solution: 'Ready for pegging.',
    });
  }

  // 2. Float Length Check
  const floatStats = calculateFloats(matrix);
  const maxSafeFloat = 6; // Typical threshold for silk/cotton handloom dobby

  if (floatStats.maxWarpFloat > maxSafeFloat) {
    issues.push({
      id: 'issue-warp-float',
      type: 'float-warp',
      severity: floatStats.maxWarpFloat > 10 ? 'problem' : 'warning',
      title: `Excessive Warp Float (${floatStats.maxWarpFloat} picks)`,
      message: `Warp threads float unbound over ${floatStats.maxWarpFloat} picks continuously.`,
      location: 'Warp columns',
      impact: 'Loose yarn floats will snag on shuttles and rings during weaving, wear prematurely, and cause irregular fabric drape.',
      solution: 'Add binder interlacements (e.g. twill or plain ground points) to break floats longer than 5-6 picks.',
    });
  }

  if (floatStats.maxWeftFloat > maxSafeFloat) {
    issues.push({
      id: 'issue-weft-float',
      type: 'float-weft',
      severity: floatStats.maxWeftFloat > 10 ? 'problem' : 'warning',
      title: `Excessive Weft Float (${floatStats.maxWeftFloat} ends)`,
      message: `Weft thread floats over ${floatStats.maxWeftFloat} warp ends continuously.`,
      location: 'Weft picks',
      impact: 'Long weft floats can sag and snag, reducing fabric tensile strength and abrasion resistance.',
      solution: 'Tie down long weft floats with ground interlacements or convert open spaces to micro-twill textures.',
    });
  }

  if (floatStats.maxWarpFloat <= maxSafeFloat && floatStats.maxWeftFloat <= maxSafeFloat) {
    issues.push({
      id: 'ok-floats',
      type: 'float-warp',
      severity: 'ok',
      title: 'Yarn Floats Well-Balanced',
      message: `Max warp float is ${floatStats.maxWarpFloat}, max weft float is ${floatStats.maxWeftFloat} (both under safe limit of ${maxSafeFloat}).`,
      location: 'Ground and motif',
      impact: 'Good structural cohesion and durability.',
      solution: 'No intervention required.',
    });
  }

  // 3. Density Distortion Check (EPI vs PPI)
  const densityRatio = ppi / Math.max(1, epi);
  const distortionPercent = Math.abs(1 - densityRatio) * 100;

  if (distortionPercent > 20) {
    const direction = ppi > epi ? 'vertically compressed (wider than tall)' : 'vertically elongated (taller than wide)';
    issues.push({
      id: 'issue-density-distortion',
      type: 'density-distortion',
      severity: distortionPercent > 40 ? 'problem' : 'warning',
      title: `Motif Distortion Detected (${distortionPercent.toFixed(0)}% stretch)`,
      message: `EPI (${epi}) and PPI (${ppi}) have an aspect ratio of ${densityRatio.toFixed(2)}. Square pixels on graph will weave ${direction}.`,
      location: 'Full fabric field',
      impact: 'Circles will appear as ovals and geometric diamonds will be squashed or stretched on the loom.',
      solution: `Compensate on the graph by adjusting pick count, or re-denting the reed to achieve closer EPI and PPI balance.`,
    });
  }

  // 4. Repeat Boundary Continuity Check
  let horizontalDiscontinuities = 0;
  for (let r = 0; r < h; r++) {
    // Check if right edge and left edge create double float
    if (matrix[r][0] === matrix[r][w - 1] && matrix[r][0] === 0) {
      horizontalDiscontinuities++;
    }
  }

  let verticalDiscontinuities = 0;
  for (let c = 0; c < w; c++) {
    if (matrix[0][c] === matrix[h - 1][c] && matrix[0][c] === 1) {
      verticalDiscontinuities++;
    }
  }

  if (horizontalDiscontinuities > w * 0.7) {
    issues.push({
      id: 'warning-repeat-h',
      type: 'broken-repeat',
      severity: 'warning',
      title: 'Potential Seam Float on Horizontal Repeat',
      message: `${horizontalDiscontinuities} picks join identical floating values across left and right edges.`,
      location: 'Left/Right seam boundary',
      impact: 'May create visible vertical seam bands or excessive float at repeat junctions.',
      solution: 'Inspect repeat seam in repeat preview mode to verify smooth transitional flow.',
    });
  }

  // 5. Selvedge Ends Check
  let edgeInterlacementsLeft = 0;
  let edgeInterlacementsRight = 0;
  for (let r = 0; r < h - 1; r++) {
    if (matrix[r][0] !== matrix[r + 1][0]) edgeInterlacementsLeft++;
    if (matrix[r][w - 1] !== matrix[r + 1][w - 1]) edgeInterlacementsRight++;
  }

  if (edgeInterlacementsLeft < h * 0.25 || edgeInterlacementsRight < h * 0.25) {
    issues.push({
      id: 'issue-selvedge',
      type: 'loose-selvedge',
      severity: 'warning',
      title: 'Low Edge Interlacement (Weak Selvedge)',
      message: 'Boundary ends have infrequent interlacements, which can cause loose cloth edges during weaving.',
      location: 'Selvedge ends (column 1 and column ' + w + ')',
      impact: 'Shuttle turnaround may loop or fringe at the cloth edges without dedicated catching threads.',
      solution: 'Ensure catch cords or dedicated plain-weave selvedge shafts (2 to 4 ends) are added on each side of the handloom.',
    });
  }

  return issues;
}
