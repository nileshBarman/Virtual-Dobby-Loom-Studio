import { DobbyDesign, LoomConfig } from '../types';
import { createMatrix } from '../weave-engine';

/**
 * Creates the Maheshwari Geometric Border Motif (24x24)
 */
function createMaheshwariMatrix(): number[][] {
  const m = createMatrix(24, 24, 0);

  // Generate traditional Maheshwari geometric chevron and diamond border with zari accent
  for (let r = 0; r < 24; r++) {
    for (let c = 0; c < 24; c++) {
      // Outer border twill stripes
      if (r < 3 || r >= 21) {
        if ((r + c) % 3 === 0) m[r][c] = 2; // Zari accent line
        else if ((r + c) % 2 === 0) m[r][c] = 1;
        continue;
      }

      // Central concentric diamond motif (rows 4 to 19, cols 2 to 21)
      const centerDistR = Math.abs(r - 11.5);
      const centerDistC = Math.abs(c - 11.5);
      const diamondRadius = centerDistR + centerDistC;

      if (diamondRadius >= 9.5 && diamondRadius <= 11) {
        m[r][c] = 2; // Outer zari diamond outline
      } else if (diamondRadius >= 6.5 && diamondRadius <= 8) {
        m[r][c] = 1; // Middle warp diamond
      } else if (diamondRadius >= 3.5 && diamondRadius <= 5) {
        m[r][c] = 2; // Inner zari diamond
      } else if (diamondRadius <= 1.5) {
        m[r][c] = 1; // Core dot
      } else if ((r + c) % 4 === 0) {
        m[r][c] = 1; // Background twill tie-down
      }
    }
  }

  return m;
}

/**
 * Creates Kanjivaram Rudraksha & Temple Border (16x16)
 */
function createKanjivaramTempleMatrix(): number[][] {
  const m = createMatrix(16, 16, 0);
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      // Stepped Temple Spire (Kumbha)
      const colInHalf = c < 8 ? c : 15 - c;
      const spireHeight = colInHalf * 2;
      if (r >= 15 - spireHeight) {
        m[r][c] = (r + c) % 2 === 0 ? 2 : 1; // Gold zari filled temple
      } else if (r <= 2) {
        m[r][c] = 2; // Top zari line
      } else if ((r + c) % 4 === 0) {
        m[r][c] = 1; // Field binder
      }
    }
  }
  return m;
}

/**
 * Creates Chanderi Flora Butti (24x24)
 */
function createChanderiButtiMatrix(): number[][] {
  const m = createMatrix(24, 24, 0);
  for (let r = 0; r < 24; r++) {
    for (let c = 0; c < 24; c++) {
      const dr = r - 12;
      const dc = c - 12;
      const dist = Math.sqrt(dr * dr + dc * dc);
      if (dist < 3) {
        m[r][c] = 2; // Zari center bud
      } else if (dist < 7 && ((r + c) % 2 === 0)) {
        m[r][c] = 1; // Petals
      } else if (dist < 9 && ((r === 12 || c === 12 || Math.abs(dr) === Math.abs(dc)))) {
        m[r][c] = 2; // Floret rays
      } else if ((r % 4 === 0 && c % 4 === 0)) {
        m[r][c] = 1; // Micro ground tie
      }
    }
  }
  return m;
}

/**
 * Creates Traditional Herringbone Twill (16x16)
 */
function createHerringboneMatrix(): number[][] {
  const m = createMatrix(16, 16, 0);
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      if (c < 8) {
        // Forward 3/1 twill
        m[r][c] = (r + c) % 4 < 2 ? 1 : 0;
      } else {
        // Reverse 3/1 twill
        m[r][c] = (r - (c - 8) + 16) % 4 < 2 ? 1 : 0;
      }
    }
  }
  return m;
}

/**
 * Creates Honeycomb Waffle Weave (12x12)
 */
function createHoneycombMatrix(): number[][] {
  const m = createMatrix(12, 12, 0);
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 12; c++) {
      const distR = Math.abs(r - 5.5);
      const distC = Math.abs(c - 5.5);
      const diamond = distR + distC;
      if (diamond <= 4.5 && diamond >= 2) {
        m[r][c] = 1;
      } else if (diamond < 2) {
        m[r][c] = 0;
      } else {
        m[r][c] = (r + c) % 2 === 0 ? 1 : 0;
      }
    }
  }
  return m;
}

export const DEFAULT_MAHESHWARI_DESIGN: DobbyDesign = {
  id: 'maheshwari-dobby-border',
  name: 'Maheshwari Inspired Dobby Border',
  category: 'Borders',
  createdAt: '2026-09-28T00:00:00.000Z',
  updatedAt: '2026-09-28T00:00:00.000Z',
  width: 24,
  height: 24,
  matrix: createMaheshwariMatrix(),
  repeatType: 'mirror-h',
  repeatMultiplierX: 2,
  repeatMultiplierY: 2,
  warpColor: '#0e274a', // Dark Navy Blue
  weftColor: '#2d4a3e', // Muted Handloom Forest Green
  zariColor: '#d9e2ec', // Silver Zari accent
  bgColor: '#0d1117',
  warpYarn: {
    material: 'silk',
    count: '20/22D Mulberry Silk',
    thickness: 2,
    twist: 'Z',
    luster: 0.8,
  },
  weftYarn: {
    material: 'cotton',
    count: '2/80s Combed Cotton',
    thickness: 2.2,
    twist: 'S',
    luster: 0.4,
  },
  epi: 48,
  ppi: 48,
  numShafts: 16,
  draftingMethod: 'reduced',
  notes: 'Traditional Maheshwari border design inspired by fort architecture on the Narmada river. Features silver zari diamond motifs with fine silk warp and combed cotton weft for crisp structure.',
  isFavorite: true,
};

export const INITIAL_DESIGNS: DobbyDesign[] = [
  DEFAULT_MAHESHWARI_DESIGN,
  {
    id: 'kanjivaram-temple-border',
    name: 'Kanjivaram Rudraksha Temple Border',
    category: 'Borders',
    createdAt: '2026-09-27T10:00:00.000Z',
    updatedAt: '2026-09-27T10:00:00.000Z',
    width: 16,
    height: 16,
    matrix: createKanjivaramTempleMatrix(),
    repeatType: 'straight',
    repeatMultiplierX: 3,
    repeatMultiplierY: 2,
    warpColor: '#7b1113', // Deep Crimson Red
    weftColor: '#3d0c11', // Maroon Dark
    zariColor: '#f59e0b', // Pure Gold Zari
    bgColor: '#160809',
    warpYarn: { material: 'silk', count: '3-ply Pure Mulberry Silk', thickness: 2.5, twist: 'Z', luster: 0.9 },
    weftYarn: { material: 'zari', count: 'Tested Gold Zari 240D', thickness: 2.6, twist: 'Z', luster: 1.0 },
    epi: 56,
    ppi: 52,
    numShafts: 16,
    draftingMethod: 'reduced',
    notes: 'Classic Kanchipuram temple (Kumbha) border with gold zari rudraksha motifs. Ideal for heavy bridal borders.',
    isFavorite: true,
  },
  {
    id: 'chanderi-flora-butti',
    name: 'Chanderi Flora & Diamond Butti',
    category: 'Butti',
    createdAt: '2026-09-26T14:30:00.000Z',
    updatedAt: '2026-09-26T14:30:00.000Z',
    width: 24,
    height: 24,
    matrix: createChanderiButtiMatrix(),
    repeatType: 'half-drop',
    repeatMultiplierX: 2,
    repeatMultiplierY: 2,
    warpColor: '#0c4a6e', // Peacock Teal
    weftColor: '#075985', // Sky Cerulean
    zariColor: '#fde047', // Champagne Gold Zari
    bgColor: '#061726',
    warpYarn: { material: 'silk', count: '13/15D Raw Silk', thickness: 1.8, twist: 'Z', luster: 0.85 },
    weftYarn: { material: 'cotton', count: '100s Mercerized Cotton', thickness: 1.7, twist: 'S', luster: 0.5 },
    epi: 64,
    ppi: 60,
    numShafts: 16,
    draftingMethod: 'reduced',
    notes: 'Delicate gossamer Chanderi allover butti. Floats kept under 4 threads to prevent snagging on sheer fabric.',
    isFavorite: false,
  },
  {
    id: 'traditional-herringbone',
    name: 'Traditional Herringbone Twill Dobby',
    category: 'Motifs',
    createdAt: '2026-09-25T09:00:00.000Z',
    updatedAt: '2026-09-25T09:00:00.000Z',
    width: 16,
    height: 16,
    matrix: createHerringboneMatrix(),
    repeatType: 'straight',
    repeatMultiplierX: 3,
    repeatMultiplierY: 3,
    warpColor: '#475569', // Slate Grey
    weftColor: '#1e293b', // Charcoal
    zariColor: '#94a3b8', // Silver Mist
    bgColor: '#0f172a',
    warpYarn: { material: 'cotton', count: '2/40s Linen-Cotton', thickness: 2.4, twist: 'Z', luster: 0.3 },
    weftYarn: { material: 'cotton', count: '2/40s Cotton', thickness: 2.4, twist: 'S', luster: 0.3 },
    epi: 44,
    ppi: 44,
    numShafts: 8,
    draftingMethod: 'point',
    notes: 'Balanced 8-shaft pointed draw herringbone twill. Reversible handloom structure suitable for stoles and jackets.',
    isFavorite: false,
  },
  {
    id: 'honeycomb-waffle-handloom',
    name: 'Honeycomb Waffle Handloom Weave',
    category: 'Experimental',
    createdAt: '2026-09-24T16:20:00.000Z',
    updatedAt: '2026-09-24T16:20:00.000Z',
    width: 12,
    height: 12,
    matrix: createHoneycombMatrix(),
    repeatType: 'straight',
    repeatMultiplierX: 3,
    repeatMultiplierY: 3,
    warpColor: '#b45309', // Ochre Amber
    weftColor: '#78350f', // Warm Cinnamon
    zariColor: '#fbbf24', // Yellow Gold
    bgColor: '#1c1006',
    warpYarn: { material: 'cotton', count: '2/20s Organic Cotton', thickness: 3.2, twist: 'Z', luster: 0.2 },
    weftYarn: { material: 'cotton', count: '2/20s Organic Cotton', thickness: 3.2, twist: 'S', luster: 0.2 },
    epi: 36,
    ppi: 36,
    numShafts: 8,
    draftingMethod: 'point',
    notes: 'Three-dimensional waffle cell structure. Shrinks and puffs after washing to create deep cellular thermal pockets.',
    isFavorite: false,
  },
];

export const DEFAULT_LOOM_CONFIGS: LoomConfig[] = [
  {
    id: 'maheshwari-pit-loom',
    name: 'Maheshwari Traditional Pit Loom (16 Shaft)',
    loomType: 'handloom-dobby',
    maxShafts: 16,
    defaultEPI: 48,
    defaultPPI: 48,
    reedDentsPerInch: 48,
    dentsPerDent: 2,
    notes: 'Traditional sunken pit loom with overhead lattice dobby mechanism.',
  },
  {
    id: 'kanjivaram-frame-dobby',
    name: 'Kanchipuram 24-Shaft Frame Dobby',
    loomType: 'handloom-dobby',
    maxShafts: 24,
    defaultEPI: 56,
    defaultPPI: 52,
    reedDentsPerInch: 56,
    dentsPerDent: 2,
    notes: 'Heavy wooden frame loom for pure silk weaving with Korvai border capacity.',
  },
  {
    id: 'student-sample-loom',
    name: 'College Studio 8-Shaft Table Loom',
    loomType: 'frame-loom',
    maxShafts: 8,
    defaultEPI: 40,
    defaultPPI: 40,
    reedDentsPerInch: 40,
    dentsPerDent: 2,
    notes: 'Standard 8-shaft educational sample loom with hand levers.',
  },
];

export const TEXTILE_COLOR_PALETTES = [
  {
    name: 'Maheshwari Fort',
    warp: '#0e274a',
    weft: '#2d4a3e',
    zari: '#d9e2ec',
    bg: '#0d1117',
  },
  {
    name: 'Kanjivaram Bridal',
    warp: '#881337',
    weft: '#4c0519',
    zari: '#fbbf24',
    bg: '#170308',
  },
  {
    name: 'Chanderi Peacock',
    warp: '#0e7490',
    weft: '#155e75',
    zari: '#fde047',
    bg: '#082f49',
  },
  {
    name: 'Pochampally Dusk',
    warp: '#581c87',
    weft: '#3b0764',
    zari: '#f472b6',
    bg: '#1e0533',
  },
  {
    name: 'Jamdani Ecru',
    warp: '#fef3c7',
    weft: '#b45309',
    zari: '#d97706',
    bg: '#291b0c',
  },
  {
    name: 'Kerala Kasavu',
    warp: '#f8fafc',
    weft: '#f1f5f9',
    zari: '#eab308',
    bg: '#111827',
  },
  {
    name: 'Modern Charcoal & Copper',
    warp: '#334155',
    weft: '#1e293b',
    zari: '#fb923c',
    bg: '#0f172a',
  },
];
