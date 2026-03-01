import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ColorScale, PaletteState, StepNamingConfig, StepNamingPreset } from '../types/palette';
import { hexToOklch, buildDefaultCurves, buildChromaCurve, oklchToHex } from '../lib/colorMath';
import { buildLightnessValues, resolveStepNames, type LightnessPreset } from '../constants/stepPresets';
import initialConfig from '../color-tokens.json';

// nanoid is a small dep, but we can also just use crypto.randomUUID
function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

interface PaletteActions {
  addScale: (sourceHex: string, name?: string) => void;
  removeScale: (id: string) => void;
  reorderScales: (fromIndex: number, toIndex: number) => void;
  setActiveScale: (id: string | null) => void;
  updateSourceHex: (id: string, hex: string) => void;
  updateScaleName: (id: string, name: string) => void;
  updateStepNaming: (id: string, naming: StepNamingConfig) => void;
  updateStepNamingAll: (naming: StepNamingConfig) => void;
  updateStepName: (id: string, index: number, name: string) => void;
  insertStepAt: (id: string, index: number, name?: string) => void;
  removeStepAt: (id: string, index: number) => void;
  setStepsAll: (names: string[]) => void;
  updateCurveValue: (id: string, channel: 'lightness' | 'chroma' | 'hue', stepIndex: number, value: number) => void;
  updateLightnessAt: (id: string, index: number, value: number) => void;
  setLightnessList: (id: string, values: number[]) => void;
  setStepList: (id: string, names: string[]) => void;
  setStepsAndLightness: (id: string, names: string[] | null, lightness: number[] | null) => void;
  setLightnessAll: (values: number[]) => void;
  updateHueShift: (id: string, end: 'lightEndAdjust' | 'darkEndAdjust', value: number) => void;
  applyLightnessPreset: (id: string, preset: LightnessPreset) => void;
  updateChromaPeak: (id: string, peak: number) => void;
  setChromaCurveValues: (id: string, values: number[]) => void;
  setFocusedStep: (ref: { scaleId: string; stepName: string } | null) => void;
  bulkCreateScales: (scales: Array<{ sourceHex: string; name: string }>, namingPreset: StepNamingPreset, lightnessPreset: LightnessPreset) => void;
}

const DEFAULT_HEX = '#1894f8';

function makeDefaultScale(sourceHex: string, name?: string): ColorScale {
  const sourceOklch = hexToOklch(sourceHex);
  const stepCount = 11;
  const normalizedHex = oklchToHex(sourceOklch);
  return {
    id: uid(),
    name: name ?? 'Color',
    sourceHex: normalizedHex,
    sourceOklch,
    sourceAlpha: sourceOklch.alpha ?? 1,
    stepCount,
    naming: { preset: 'tailwind' },
    curves: buildDefaultCurves(sourceOklch, stepCount),
    hueShift: { lightEndAdjust: 0, darkEndAdjust: 0 },
    lightnessPreset: 'tailwind',
    chromaPeak: sourceOklch.c,
  };
}

type PaletteConfig = {
  version?: number;
  activeScaleId?: string | null;
  scales?: Partial<ColorScale>[];
};

function normalizeNames(scale: ColorScale): string[] {
  return resolveStepNames(scale.naming.preset, scale.stepCount, scale.naming.customNames);
}

function insertCurveValue(values: number[], index: number, fallback: number): number[] {
  const prev = values[index - 1];
  const next = values[index];
  const value =
    typeof prev === 'number' && typeof next === 'number'
      ? (prev + next) / 2
      : typeof prev === 'number'
        ? prev
        : typeof next === 'number'
          ? next
          : fallback;
  const nextValues = values.slice();
  nextValues.splice(index, 0, value);
  return nextValues;
}

function removeCurveValue(values: number[], index: number): number[] {
  const nextValues = values.slice();
  nextValues.splice(index, 1);
  return nextValues;
}

function resampleCurve(values: number[], nextCount: number): number[] {
  if (nextCount <= 0) return [];
  if (values.length === 0) return Array(nextCount).fill(0);
  if (values.length === 1) return Array(nextCount).fill(values[0]);
  return Array.from({ length: nextCount }, (_, i) => {
    const t = nextCount === 1 ? 0 : i / (nextCount - 1);
    const idx = t * (values.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, values.length - 1);
    const frac = idx - lo;
    return values[lo] + (values[hi] - values[lo]) * frac;
  });
}

function ensureCurve(values: number[] | undefined, nextCount: number, fallback: number): number[] {
  if (!values || values.length === 0) {
    return Array.from({ length: nextCount }, () => fallback);
  }
  return resampleCurve(values, nextCount);
}

function inferStepCount(partial: Partial<ColorScale>): number {
  const countFromCurves =
    partial.curves?.lightness?.values?.length ??
    partial.curves?.chroma?.values?.length ??
    partial.curves?.hue?.values?.length ??
    0;
  const countFromNames = partial.naming?.customNames?.length ?? 0;
  const raw = partial.stepCount ?? countFromCurves ?? countFromNames ?? 11;
  return Math.max(1, Math.floor(raw));
}

function inflateScale(partial: Partial<ColorScale>, fallbackName: string): ColorScale {
  const sourceHexInput = typeof partial.sourceHex === 'string' ? partial.sourceHex : DEFAULT_HEX;
  const sourceOklch = hexToOklch(sourceHexInput);
  const stepCount = inferStepCount(partial);

  const baseCurves = buildDefaultCurves(sourceOklch, stepCount);

  const curves = {
    lightness: {
      values: ensureCurve(
        partial.curves?.lightness?.values,
        stepCount,
        baseCurves.lightness.values[0] ?? sourceOklch.l
      ),
    },
    chroma: {
      values: ensureCurve(
        partial.curves?.chroma?.values,
        stepCount,
        partial.chromaPeak ?? sourceOklch.c
      ),
    },
    hue: {
      values: ensureCurve(
        partial.curves?.hue?.values,
        stepCount,
        0
      ),
    },
  };

  const fallbackPreset = stepCount === 11 ? 'tailwind' : 'numeric';
  const namingPreset = partial.naming?.preset ?? fallbackPreset;
  const customNames = partial.naming?.customNames;
  const naming: StepNamingConfig =
    namingPreset === 'custom' && customNames && customNames.length === stepCount
      ? { preset: 'custom', customNames }
      : { preset: namingPreset === 'custom' ? fallbackPreset : namingPreset };

  return {
    id: typeof partial.id === 'string' ? partial.id : uid(),
    name: typeof partial.name === 'string' ? partial.name : fallbackName,
    sourceHex: oklchToHex(sourceOklch),
    sourceOklch,
    sourceAlpha: sourceOklch.alpha ?? 1,
    stepCount,
    naming,
    curves,
    hueShift: {
      lightEndAdjust: partial.hueShift?.lightEndAdjust ?? 0,
      darkEndAdjust: partial.hueShift?.darkEndAdjust ?? 0,
    },
    lightnessPreset: (partial.lightnessPreset as LightnessPreset) ?? (partial.curves?.lightness ? 'custom' : 'tailwind'),
    chromaPeak: partial.chromaPeak ?? sourceOklch.c,
  };
}

function loadInitialState(): PaletteState {
  const cfg = (initialConfig ?? {}) as PaletteConfig;
  if (Array.isArray(cfg.scales) && cfg.scales.length > 0) {
    const scales = cfg.scales.map((scale, i) => inflateScale(scale, `Color ${i + 1}`));
    const activeScaleId =
      cfg.activeScaleId && scales.some((s) => s.id === cfg.activeScaleId)
        ? cfg.activeScaleId
        : null;
    return { scales, activeScaleId, focusedStepRef: null };
  }
  return {
    scales: [makeDefaultScale(DEFAULT_HEX, 'Blue')],
    activeScaleId: null,
    focusedStepRef: null,
  };
}

export const usePaletteStore = create<PaletteState & PaletteActions>()(
  immer((set) => ({
    ...loadInitialState(),

    addScale: (sourceHex, name) => set((state) => {
      const scale = makeDefaultScale(sourceHex, name ?? `Color ${state.scales.length + 1}`);

      // Inherit naming + step count from existing scales so all ramps stay in sync
      const reference = state.scales[0];
      if (reference) {
        scale.naming = reference.naming.customNames
          ? { preset: reference.naming.preset, customNames: reference.naming.customNames.slice() }
          : { preset: reference.naming.preset };
        scale.stepCount = reference.stepCount;
        scale.curves = buildDefaultCurves(scale.sourceOklch, reference.stepCount);
      }

      state.scales.push(scale);
      state.activeScaleId = scale.id;
    }),

    removeScale: (id) => set((state) => {
      state.scales = state.scales.filter((s) => s.id !== id);
      if (state.activeScaleId === id) {
        state.activeScaleId = state.scales[0]?.id ?? null;
      }
    }),

    reorderScales: (fromIndex, toIndex) => set((state) => {
      if (fromIndex === toIndex) return;
      const [item] = state.scales.splice(fromIndex, 1);
      state.scales.splice(toIndex, 0, item);
    }),

    setActiveScale: (id) => set((state) => {
      state.activeScaleId = id;
    }),

    updateSourceHex: (id, hex) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      try {
        const sourceOklch = hexToOklch(hex);
        scale.sourceHex = oklchToHex(sourceOklch);
        scale.sourceOklch = sourceOklch;
        scale.sourceAlpha = sourceOklch.alpha ?? 1;
        const newCurves = buildDefaultCurves(sourceOklch, scale.stepCount);
        // Preserve user's chroma peak — don't let the new source color override it
        newCurves.chroma.values = buildChromaCurve(scale.chromaPeak, scale.stepCount);
        // Preserve lightness — re-apply the active preset or keep custom values
        if (scale.lightnessPreset === 'custom') {
          newCurves.lightness.values = scale.curves.lightness.values.slice();
        } else if (scale.lightnessPreset !== 'tailwind') {
          newCurves.lightness.values = buildLightnessValues(scale.lightnessPreset as LightnessPreset, scale.stepCount);
        }
        scale.curves = newCurves;
      } catch {
        // Invalid hex — ignore
      }
    }),

    updateScaleName: (id, name) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (scale) scale.name = name;
    }),

    updateStepNaming: (id, naming) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (scale) scale.naming = naming;
    }),

    updateStepNamingAll: (naming) => set((state) => {
      for (const scale of state.scales) {
        scale.naming = naming;
      }
    }),

    updateStepName: (id, index, name) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const names = normalizeNames(scale);
      if (index < 0 || index >= names.length) return;
      names[index] = name;
      scale.naming = { preset: 'custom', customNames: names };
    }),

    insertStepAt: (id, index, name) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const names = normalizeNames(scale);
      const clampedIndex = Math.max(0, Math.min(index, names.length));
      const nextNames = names.slice();
      const insertName = name ?? 'New';
      nextNames.splice(clampedIndex, 0, insertName);
      scale.naming = { preset: 'custom', customNames: nextNames };
      scale.stepCount = nextNames.length;

      scale.curves.lightness.values = insertCurveValue(
        scale.curves.lightness.values,
        clampedIndex,
        scale.sourceOklch.l
      );
      scale.curves.chroma.values = insertCurveValue(
        scale.curves.chroma.values,
        clampedIndex,
        scale.chromaPeak
      );
      scale.curves.hue.values = insertCurveValue(
        scale.curves.hue.values,
        clampedIndex,
        0
      );
    }),

    removeStepAt: (id, index) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const names = normalizeNames(scale);
      if (names.length <= 1) return;
      if (index < 0 || index >= names.length) return;
      const nextNames = names.slice();
      nextNames.splice(index, 1);
      scale.naming = { preset: 'custom', customNames: nextNames };
      scale.stepCount = nextNames.length;
      scale.curves.lightness.values = removeCurveValue(scale.curves.lightness.values, index);
      scale.curves.chroma.values = removeCurveValue(scale.curves.chroma.values, index);
      scale.curves.hue.values = removeCurveValue(scale.curves.hue.values, index);
    }),

    updateCurveValue: (id, channel, stepIndex, value) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      scale.curves[channel].values[stepIndex] = value;
    }),

    updateLightnessAt: (id, index, value) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const clamped = Math.max(0, Math.min(1, value));
      scale.curves.lightness.values[index] = clamped;
      scale.lightnessPreset = 'custom';
    }),

    setLightnessList: (id, values) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const clampedValues = values.map((v) => Math.max(0, Math.min(1, v)));
      scale.curves.lightness.values = clampedValues.slice();
      scale.stepCount = clampedValues.length;
      const names = normalizeNames(scale);
      if (names.length !== clampedValues.length) {
        scale.naming = {
          preset: 'custom',
          customNames: resampleCurve(
            names.map((_, i) => i),
            clampedValues.length
          ).map((_, i) => String(i + 1)),
        };
      }
      scale.lightnessPreset = 'custom';
      scale.curves.chroma.values = resampleCurve(scale.curves.chroma.values, clampedValues.length);
      scale.curves.hue.values = resampleCurve(scale.curves.hue.values, clampedValues.length);
    }),

    setStepList: (id, names) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const cleaned = names.map((n) => n.trim()).filter(Boolean);
      if (!cleaned.length) return;
      scale.naming = { preset: 'custom', customNames: cleaned };
      scale.stepCount = cleaned.length;
      scale.curves.lightness.values = resampleCurve(scale.curves.lightness.values, cleaned.length);
      scale.curves.chroma.values = resampleCurve(scale.curves.chroma.values, cleaned.length);
      scale.curves.hue.values = resampleCurve(scale.curves.hue.values, cleaned.length);
    }),

    setStepsAll: (names) => set((state) => {
      const cleaned = names.map((n) => n.trim()).filter(Boolean);
      if (!cleaned.length) return;
      for (const scale of state.scales) {
        scale.naming = { preset: 'custom', customNames: cleaned };
        scale.stepCount = cleaned.length;
        scale.curves.lightness.values = resampleCurve(scale.curves.lightness.values, cleaned.length);
        scale.curves.chroma.values = resampleCurve(scale.curves.chroma.values, cleaned.length);
        scale.curves.hue.values = resampleCurve(scale.curves.hue.values, cleaned.length);
      }
    }),

    setStepsAndLightness: (id, names, lightness) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const nextNames = names && names.length ? names.map((n) => n.trim()).filter(Boolean) : null;
      const nextLightness = lightness && lightness.length
        ? lightness.map((v) => Math.max(0, Math.min(1, v)))
        : null;

      if (!nextNames && !nextLightness) return;
      const nextCount =
        nextNames?.length ??
        nextLightness?.length ??
        scale.stepCount;

      if (nextNames) {
        scale.naming = { preset: 'custom', customNames: nextNames };
      } else {
        const namesResolved = normalizeNames(scale);
        if (namesResolved.length !== nextCount) {
          scale.naming = {
            preset: 'custom',
            customNames: Array.from({ length: nextCount }, (_, i) => String(i + 1)),
          };
        }
      }

      scale.stepCount = nextCount;

      if (nextLightness) {
        scale.curves.lightness.values = nextLightness.slice();
        scale.lightnessPreset = 'custom';
      } else {
        scale.curves.lightness.values = resampleCurve(scale.curves.lightness.values, nextCount);
      }

      scale.curves.chroma.values = resampleCurve(scale.curves.chroma.values, nextCount);
      scale.curves.hue.values = resampleCurve(scale.curves.hue.values, nextCount);
    }),
    
    setLightnessAll: (values) => set((state) => {
      const cleaned = values.length ? values.map((v) => Math.max(0, Math.min(1, v))) : [];
      if (!cleaned.length) return;
      for (const scale of state.scales) {
        scale.curves.lightness.values = resampleCurve(cleaned, scale.stepCount);
        scale.lightnessPreset = 'custom';
      }
    }),

    updateHueShift: (id, end, value) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (scale) scale.hueShift[end] = value;
    }),

    applyLightnessPreset: (id, preset) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      if (preset === 'custom') {
        scale.lightnessPreset = 'custom';
        return;
      }
      scale.curves.lightness.values = buildLightnessValues(preset, scale.stepCount);
      scale.lightnessPreset = preset;
    }),

    updateChromaPeak: (id, peak) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      const clamped = Math.max(0, Math.min(0.4, peak));
      scale.chromaPeak = clamped;
      scale.curves.chroma.values = buildChromaCurve(clamped, scale.stepCount);
    }),

    setChromaCurveValues: (id, values) => set((state) => {
      const scale = state.scales.find((s) => s.id === id);
      if (!scale) return;
      scale.curves.chroma.values = values.slice(0, scale.stepCount);
    }),

    setFocusedStep: (ref) => set((state) => {
      state.focusedStepRef = ref;
    }),

    bulkCreateScales: (scaleInputs, namingPreset, lightnessPreset) => set((state) => {
      for (const { sourceHex, name } of scaleInputs) {
        const scale = makeDefaultScale(sourceHex, name);
        scale.naming = { preset: namingPreset };
        if (lightnessPreset !== 'tailwind' && lightnessPreset !== 'custom') {
          scale.curves.lightness.values = buildLightnessValues(lightnessPreset, scale.stepCount);
          scale.lightnessPreset = lightnessPreset;
        }
        state.scales.push(scale);
      }
      state.activeScaleId = state.scales[0]?.id ?? null;
    }),
  }))
);

// Selector helpers
export const selectActiveScale = (state: PaletteState & PaletteActions): ColorScale | undefined =>
  state.scales.find((s) => s.id === (state.activeScaleId ?? state.scales[0]?.id));
