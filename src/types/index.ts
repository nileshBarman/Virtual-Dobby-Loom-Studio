export type GridMatrix = number[][]; // 0 = weft up, 1 = warp up, 2 = zari / accent

export type RepeatType = 'straight' | 'mirror-h' | 'mirror-v' | 'mirror-both' | 'half-drop' | 'alternate';

export type DraftingMethod = 'straight' | 'point' | 'reduced' | 'skip';

export type YarnMaterial = 'silk' | 'cotton' | 'zari' | 'linen' | 'wool';

export interface YarnConfig {
  material: YarnMaterial;
  count: string; // e.g. "2/80s", "20/22D", "2/60s Cotton"
  thickness: number; // 1 to 5 relative visual thickness
  twist: 'Z' | 'S';
  luster: number; // 0 (matte) to 1 (high shine)
}

export interface DobbyDesign {
  id: string;
  name: string;
  category: 'Borders' | 'Butti' | 'Motifs' | 'Pallu' | 'Experimental' | 'Saved Samples';
  createdAt: string;
  updatedAt: string;
  width: number; // Warp ends in repeat
  height: number; // Weft picks in repeat
  matrix: GridMatrix; // [row][col] where row is pick (0=top or 1st pick), col is warp end
  repeatType: RepeatType;
  repeatMultiplierX: number;
  repeatMultiplierY: number;
  warpColor: string;
  weftColor: string;
  zariColor: string;
  bgColor: string;
  warpYarn: YarnConfig;
  weftYarn: YarnConfig;
  epi: number; // Ends per inch
  ppi: number; // Picks per inch
  numShafts: number; // Handloom dobby shaft capacity (e.g. 8, 12, 16, 24)
  draftingMethod: DraftingMethod;
  notes: string;
  isFavorite?: boolean;
  thumbnail?: string;
}

export interface LoomConfig {
  id: string;
  name: string;
  loomType: 'handloom-dobby' | 'barrel-dobby' | 'electronic-dobby' | 'pit-loom' | 'frame-loom';
  maxShafts: number;
  defaultEPI: number;
  defaultPPI: number;
  reedDentsPerInch: number;
  dentsPerDent: number;
  notes: string;
}

export interface WeavingIssue {
  id: string;
  type: 'float-warp' | 'float-weft' | 'broken-repeat' | 'shaft-capacity' | 'density-distortion' | 'loose-selvedge';
  severity: 'problem' | 'warning' | 'ok'; // red, yellow, green
  title: string;
  message: string;
  location: string;
  impact: string;
  solution: string;
}

export interface DraftingResult {
  drafting: number[]; // For each warp end (0 to W-1), which shaft index (0 to numShafts-1)
  liftingPlan: boolean[][]; // [pick][shaftIndex] = true if shaft lifted
  pegPlanMatrix: number[][]; // [pick][shaftIndex] = 1 or 0
  minShaftsNeeded: number;
  capacityExceeded: boolean;
  uniquePatternsCount: number;
}

export interface SimulationState {
  currentPick: number;
  totalPicks: number;
  isPlaying: boolean;
  speedMs: number;
  isPaused: boolean;
  shedOpening: number; // 0 to 1 (0=closed beat-up, 1=fully open shed)
  shuttlePosition: number; // 0 to 1 (left to right)
  shuttleDirection: 'L2R' | 'R2L';
  reedPosition: number; // 0 to 1 (0=back, 1=beat-up at cloth fell)
  liftedShafts: number[];
}

export interface SareeConfig {
  totalLengthMeters: number; // 5.5 to 6.2
  widthInches: number; // 45 to 48
  bodyColor: string;
  bodyPatternType: 'plain' | 'butti' | 'striped' | 'custom';
  bodyDesignId?: string;
  topBorderWidthInches: number;
  bottomBorderWidthInches: number;
  borderDesignId: string;
  borderZari: boolean;
  borderMirror: boolean;
  palluLengthInches: number; // 28 to 36
  palluDesignId: string;
  palluZariBandsCount: number;
  blouseLengthInches: number; // 32
  blouseColor: string;
  blouseContrast: boolean;
  blouseBorder: boolean;
}

export interface ComparisonVersion {
  id: string;
  label: string;
  epi: number;
  ppi: number;
  warpColor: string;
  weftColor: string;
  warpMaterial: YarnMaterial;
  weftMaterial: YarnMaterial;
  notes: string;
}
