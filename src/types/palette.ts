export interface OklchColor { l: number; c: number; h: number; alpha?: number }

export interface CurvePoints {
  values: number[];
  nodeTypes?: ('smooth' | 'corner')[];  // per-step; defaults to 'smooth'
  smoothing?: number;                    // 0–1; non-destructive, applied in generateRamp
}

export interface CurveConfig {
  lightness: CurvePoints;  // 0–1 per step
  chroma:    CurvePoints;  // 0–0.4 per step
  hue:       CurvePoints;  // delta degrees (-180–180) from base hue
}

export interface HueShiftConfig {
  lightEndAdjust: number;  // degrees added to auto warm shift at lightest steps (default 0)
  darkEndAdjust:  number;  // degrees added to auto cool shift at darkest steps (default 0)
}

export type StepNamingPreset = 'tailwind' | 'numeric' | 'custom';
export interface StepNamingConfig {
  preset: StepNamingPreset;
  customNames?: string[];
}

export interface ColorScale {
  id: string;
  name: string;
  sourceHex: string;
  sourceOklch: OklchColor;
  sourceAlpha: number;
  stepCount: number;           // default: 11
  naming: StepNamingConfig;
  curves: CurveConfig;
  hueShift: HueShiftConfig;
  lightnessPreset: string;     // last-applied lightness preset key
  chromaPeak: number;          // 0–0.4, peak of the chroma bell curve
  chromaLow?: number;          // 0–0.4, chroma floor at light end (step 0). Default: 0
  chromaHigh?: number;         // 0–0.4, chroma floor at dark end (last step). Default: 0
  lockedFromOverrides?: boolean; // if true, skip bulk lightness/step overrides
}

export type GamutLevel = 'srgb' | 'p3' | 'out';

export interface RgbChannels { r: number; g: number; b: number }

export interface GeneratedStep {
  name: string;
  oklch: OklchColor;
  hex: string;          // sRGB-clamped hex (always safe fallback)
  srgb: RgbChannels;    // sRGB r,g,b in [0,1] matching `hex` — authoritative channel data for srgb-gamut export
  p3?: RgbChannels;     // display-p3 r,g,b in [0,1] when gamut === 'p3'
  displayP3?: string;   // color(display-p3 ...) CSS string, present only when gamut === 'p3'
  relativeLuminance: number;
  gamut: GamutLevel;   // gamut of the ideal (pre-sRGB-clamp) color
  maxSrgbC: number;    // max sRGB chroma at this step's L and H (for P3 threshold line)
}

export interface GeneratedRamp {
  scaleId: string;
  scaleName: string;
  steps: GeneratedStep[];
}

export type WCAGLevel = 'AAA' | 'AA' | 'AA-large' | 'fail';
export interface ContrastResult { ratio: number; level: WCAGLevel }

export type ContrastMode = 'wcag' | 'apca';

export interface ContrastMapColorRef { ramp: string; step: string; hex: string }
export interface WcagMapEntry { fg: ContrastMapColorRef; bg: ContrastMapColorRef; ratio: number }
export interface ApcaMapEntry { fg: ContrastMapColorRef; bg: ContrastMapColorRef; lc: number }

export interface SavedPalette {
  id: string;
  name: string;
  activeScaleId: string | null;
  scales: ColorScale[];
}

export interface PaletteState {
  scales: ColorScale[];
  activeScaleId: string | null;
  focusedStepRef: { scaleId: string; stepName: string } | null;
  contrastMode: ContrastMode;
  srgbPreview: boolean;
  savedPalettes: SavedPalette[];
  activePaletteId: string | null;
  currentPaletteName: string;
}

// W3C DTCG 2025.10 color value format
export interface W3CColorValue {
  colorSpace: string;
  components: (number | 'none')[];
  alpha?: number;
  hex?: string;
}
export interface W3CTokenValue { $value: W3CColorValue; $type?: 'color'; $description?: string }
export type W3CTokenGroup = { [k: string]: W3CTokenValue | W3CTokenGroup }
