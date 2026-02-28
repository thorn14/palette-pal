import type { StepNamingPreset } from '../types/palette';

export type LightnessPreset = 'tailwind' | 'linear' | 'eased' | 'material' | 'custom';

export const LIGHTNESS_PRESET_OPTIONS: { value: LightnessPreset; label: string }[] = [
  { value: 'tailwind',  label: 'Tailwind'  },
  { value: 'linear',    label: 'Linear'    },
  { value: 'eased',     label: 'Eased'     },
  { value: 'material',  label: 'Material'  },
  { value: 'custom',    label: 'Custom…'       },
];

// Material Design tonal lightness reference (index 0 = lightest)
const MATERIAL_LIGHTNESS: number[] = [0.99, 0.95, 0.90, 0.80, 0.70, 0.60, 0.50, 0.40, 0.30, 0.20, 0.10];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateRef(ref: number[], t: number): number {
  const idx = t * (ref.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, ref.length - 1);
  return lerp(ref[lo], ref[hi], idx - lo);
}

export function buildLightnessValues(preset: LightnessPreset, stepCount: number): number[] {
  return Array.from({ length: stepCount }, (_, i) => {
    const t = stepCount === 1 ? 0 : i / (stepCount - 1);
    switch (preset) {
      case 'tailwind':
        return interpolateRef(TAILWIND_LIGHTNESS, t);
      case 'linear':
        return lerp(0.98, 0.13, t);
      case 'eased': {
        // Smoothstep: slow at extremes, fast in the middle
        const st = t * t * (3 - 2 * t);
        return lerp(0.98, 0.13, st);
      }
      case 'material':
        return interpolateRef(MATERIAL_LIGHTNESS, t);
      case 'custom':
        return 0.5;
    }
  });
}

export const TAILWIND_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'] as const;

export const NUMERIC_STEPS_11 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] as const;

// Lightness values from color-converter reference (index 0 = lightest)
export const TAILWIND_LIGHTNESS: number[] = [
  0.9927,  // 50
  0.9745,  // 100
  0.9344,  // 200
  0.8511,  // 300
  0.7623,  // 400
  0.6548,  // 500
  0.5388,  // 600
  0.4115,  // 700
  0.2991,  // 800
  0.2215,  // 900
  0.196,   // 950
];

export function resolveStepNames(preset: StepNamingPreset, stepCount: number, customNames?: string[]): string[] {
  if (preset === 'tailwind') {
    // Use standard 11-step tailwind names if count matches, otherwise interpolate
    if (stepCount === 11) return [...TAILWIND_STEPS];
    // For other counts, generate evenly spaced numeric multiples of 100
    return Array.from({ length: stepCount }, (_, i) => String(Math.round((i / (stepCount - 1)) * 900 + 50)));
  }
  if (preset === 'numeric') {
    return Array.from({ length: stepCount }, (_, i) => String(i + 1));
  }
  if (preset === 'custom' && customNames && customNames.length === stepCount) {
    return customNames;
  }
  // Fallback: numeric
  return Array.from({ length: stepCount }, (_, i) => String(i + 1));
}
