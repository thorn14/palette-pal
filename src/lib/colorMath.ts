import { parse, oklch, formatHex, wcagContrast, clampChroma, converter } from 'culori';
import type { ColorScale, OklchColor, GeneratedStep, GeneratedRamp, ContrastResult, WCAGLevel, GamutLevel } from '../types/palette';

const toRgb = converter('rgb');
const toP3  = converter('p3');
import { TAILWIND_LIGHTNESS } from '../constants/stepPresets';
import { resolveStepNames } from '../constants/stepPresets';

// Convert hex string to OklchColor
export function hexToOklch(hex: string): OklchColor {
  const normalized = hex.startsWith('#') ? hex : `#${hex}`;
  const parsed = parse(normalized);
  if (!parsed) throw new Error(`Invalid hex color: ${hex}`);
  const color = oklch(parsed);
  if (!color) throw new Error(`Cannot convert to OKLCH: ${hex}`);
  return {
    l: color.l ?? 0,
    c: color.c ?? 0,
    h: color.h ?? 0,
  };
}

// Attempt to parse and return OklchColor, or null on failure
export function tryParseHex(hex: string): OklchColor | null {
  try {
    return hexToOklch(hex);
  } catch {
    return null;
  }
}

// Convert OklchColor to hex string
export function oklchToHex(color: OklchColor): string {
  const culoriColor = { mode: 'oklch' as const, l: color.l, c: color.c, h: color.h };
  return formatHex(culoriColor) ?? '#000000';
}

// Compute relative luminance for WCAG (using culori's wcagContrast against white/black trick)
export function getRelativeLuminance(hex: string): number {
  const ratio = wcagContrast(hex, '#000000');
  // wcagContrast = (L1 + 0.05) / (L2 + 0.05), where L2=0 for black
  // So ratio = (L + 0.05) / 0.05 => L = ratio * 0.05 - 0.05
  return ratio * 0.05 - 0.05;
}

// WCAG contrast ratio and level classification
export function getContrast(hexA: string, hexB: string): ContrastResult {
  const ratio = wcagContrast(hexA, hexB);
  let level: WCAGLevel;
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  else if (ratio >= 3) level = 'AA-large';
  else level = 'fail';
  return { ratio, level };
}

// Classify a pre-clamped OKLCH color into its gamut tier
export function checkGamut(l: number, c: number, h: number): GamutLevel {
  const pre = { mode: 'oklch' as const, l, c, h };
  const rgb = toRgb(pre);
  const inSrgb = rgb &&
    rgb.r != null && rgb.g != null && rgb.b != null &&
    rgb.r >= -0.001 && rgb.r <= 1.001 &&
    rgb.g >= -0.001 && rgb.g <= 1.001 &&
    rgb.b >= -0.001 && rgb.b <= 1.001;
  if (inSrgb) return 'srgb';

  const p3 = toP3(pre);
  const inP3 = p3 &&
    p3.r != null && p3.g != null && p3.b != null &&
    p3.r >= -0.001 && p3.r <= 1.001 &&
    p3.g >= -0.001 && p3.g <= 1.001 &&
    p3.b >= -0.001 && p3.b <= 1.001;
  if (inP3) return 'p3';

  return 'out';
}

// Binary-search for the maximum chroma that stays in sRGB at the given L and H
export function maxSrgbChroma(l: number, h: number): number {
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (checkGamut(l, mid, h) === 'srgb') lo = mid;
    else hi = mid;
  }
  return lo;
}

// Binary-search for the maximum chroma that stays within P3 at the given L and H
export function maxP3Chroma(l: number, h: number): number {
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    const g = checkGamut(l, mid, h);
    if (g === 'srgb' || g === 'p3') lo = mid;
    else hi = mid;
  }
  return lo;
}

// Build a bell-curve chroma array peaked at chromaPeak
export function buildChromaCurve(chromaPeak: number, stepCount: number): number[] {
  return Array.from({ length: stepCount }, (_, i) => {
    const t = stepCount === 1 ? 0 : i / (stepCount - 1);
    const peak = 0.45;
    const width = 0.35;
    const bell = Math.exp(-Math.pow((t - peak) / width, 2));
    return chromaPeak * bell;
  });
}

// Nearest RGB primary hue (R=0°, G=120°, B=240°)
function nearestPrimary(baseHue: number): number {
  return [0, 120, 240].reduce((best, p) =>
    Math.abs(circularDist(baseHue, p)) < Math.abs(circularDist(baseHue, best)) ? p : best
  );
}

function circularDist(a: number, b: number): number {
  const d = ((b - a) % 360 + 360) % 360;
  return d > 180 ? d - 360 : d;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Auto shift base: how many degrees to shift by default, based on how far the
// source hue sits from the nearest RGB primary (R=0°, G=120°, B=240°).
// At a primary → small default (5°). Equidistant between two primaries → larger (25°).
export function autoHueShiftBase(baseHue: number): number {
  const primaries = [0, 120, 240];
  const distToNearest = Math.min(...primaries.map((p) => Math.abs(circularDist(baseHue, p))));
  // Normalise: max equidistant distance = 60°
  const proximity = Math.min(distToNearest / 60, 1);
  return 5 + 20 * proximity;
}

// Compute hue shift for a given step position.
// t=0 is lightest step, t=1 is darkest step.
// Both ends shift toward the nearest RGB primary (R=0°, G=120°, B=240°).
// lightEndAdjust / darkEndAdjust: degree offset on top of auto base.
//   Positive = more shift toward primary; negative = less (or reversed).
export function computeHueShift(
  baseHue: number,
  t: number,
  lightEndAdjust: number,
  darkEndAdjust: number,
): number {
  // Both ends use the same target: nearest RGB primary
  const primary = nearestPrimary(baseHue);
  const dir = Math.sign(circularDist(baseHue, primary));

  const autoBase = autoHueShiftBase(baseHue);

  // No floor clamp — negative total reverses direction away from primary
  const lightShiftAmount = dir * (autoBase + lightEndAdjust);
  const darkShiftAmount  = dir * (autoBase + darkEndAdjust);

  // Concentrate shift only at the ends — weight falls off quadratically to zero by the midpoint
  const lightWeight = Math.pow(Math.max(0, 1 - t * 2), 2);
  const darkWeight  = Math.pow(Math.max(0, 1 - (1 - t) * 2), 2);

  return lightShiftAmount * lightWeight + darkShiftAmount * darkWeight;
}

// Build default curves for a new scale based on source OKLCH
export function buildDefaultCurves(sourceOklch: OklchColor, stepCount: number): ColorScale['curves'] {
  // Lightness: use reference values (11 steps), interpolate for other counts
  const lightnessValues: number[] = [];
  for (let i = 0; i < stepCount; i++) {
    const t = stepCount === 1 ? 0 : i / (stepCount - 1);
    const refIdx = t * (TAILWIND_LIGHTNESS.length - 1);
    const lo = Math.floor(refIdx);
    const hi = Math.min(lo + 1, TAILWIND_LIGHTNESS.length - 1);
    const frac = refIdx - lo;
    lightnessValues.push(lerp(TAILWIND_LIGHTNESS[lo], TAILWIND_LIGHTNESS[hi], frac));
  }

  // Chroma: bell-curve scaled to source chroma, peaked near step 5-6 of 11
  const chromaValues = buildChromaCurve(sourceOklch.c, stepCount);

  // Hue deltas: all zeros initially
  const hueValues = Array(stepCount).fill(0);

  return {
    lightness: { values: lightnessValues },
    chroma: { values: chromaValues },
    hue: { values: hueValues },
  };
}

// Core ramp generation algorithm
export function generateRamp(scale: ColorScale): GeneratedRamp {
  const { id, name, sourceOklch, stepCount, naming, curves, hueShift } = scale;
  const stepNames = resolveStepNames(naming.preset, stepCount, naming.customNames);

  const steps: GeneratedStep[] = [];

  for (let i = 0; i < stepCount; i++) {
    const l = curves.lightness.values[i] ?? sourceOklch.l;
    const c = curves.chroma.values[i] ?? sourceOklch.c;
    const baseDeltaH = curves.hue.values[i] ?? 0;

    // t=0 is lightest (i=0), t=1 is darkest (i=stepCount-1)
    const t = stepCount === 1 ? 0 : i / (stepCount - 1);
    const hueShiftDelta = computeHueShift(sourceOklch.h, t, hueShift.lightEndAdjust, hueShift.darkEndAdjust);

    const h = ((sourceOklch.h + baseDeltaH + hueShiftDelta) % 360 + 360) % 360;

    // Clamp chroma to P3 gamut first — no color should exceed P3
    const cP3 = Math.min(c, maxP3Chroma(l, h));

    // Classify gamut of the P3-clamped ideal color (will be 'srgb' or 'p3', never 'out')
    const gamut = checkGamut(l, cP3, h);

    // For P3 colors, compute the full-gamut CSS value before sRGB clamping
    let displayP3: string | undefined;
    if (gamut === 'p3') {
      const p3 = toP3({ mode: 'oklch' as const, l, c: cP3, h });
      if (p3) {
        displayP3 = `color(display-p3 ${(p3.r ?? 0).toFixed(4)} ${(p3.g ?? 0).toFixed(4)} ${(p3.b ?? 0).toFixed(4)})`;
      }
    }

    // Clamp to sRGB for display hex
    const culoriColor = clampChroma({ mode: 'oklch' as const, l, c: cP3, h }, 'oklch');
    const hex = formatHex(culoriColor) ?? '#000000';
    const oklchOut: OklchColor = {
      l: culoriColor.l ?? l,
      c: culoriColor.c ?? cP3,
      h: culoriColor.h ?? h,
    };

    const relativeLuminance = getRelativeLuminance(hex);

    steps.push({
      name: stepNames[i],
      oklch: oklchOut,
      hex,
      displayP3,
      relativeLuminance,
      gamut,
      maxSrgbC: maxSrgbChroma(l, h),
    });
  }

  return { scaleId: id, scaleName: name, steps };
}
