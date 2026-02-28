export interface OklchColor { l: number; c: number; h: number; alpha?: number }

export interface CurvePoints { values: number[] }  // one per step

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
}

export type GamutLevel = 'srgb' | 'p3' | 'out';

export interface GeneratedStep {
  name: string;
  oklch: OklchColor;
  hex: string;          // sRGB-clamped hex (always safe fallback)
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

export interface PaletteState {
  scales: ColorScale[];
  activeScaleId: string | null;
  focusedStepRef: { scaleId: string; stepName: string } | null;
}

// W3C Design Tokens format
export interface W3CTokenValue { $value: string; $type: 'color'; $description?: string }
export type W3CTokenGroup = { [k: string]: W3CTokenValue | W3CTokenGroup }
