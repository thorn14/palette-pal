import { getContrast, getApcaContrast } from './colorMath';
import type { GeneratedRamp, WcagMapEntry, ApcaMapEntry } from '../types/palette';

interface ContrastMapMeta {
  version: string;
  generated: string;
  totalRamps: number;
  totalSteps: number;
}

export interface WcagContrastMap extends ContrastMapMeta {
  wcag: { 'aa-large': WcagMapEntry[]; aa: WcagMapEntry[]; aaa: WcagMapEntry[] };
}

export interface ApcaContrastMap extends ContrastMapMeta {
  apca: { lc45: ApcaMapEntry[]; lc60: ApcaMapEntry[]; lc75: ApcaMapEntry[] };
}

function buildSteps(ramps: GeneratedRamp[]) {
  return ramps.flatMap((r) =>
    r.steps.map((s) => ({ ramp: r.scaleName, step: s.name, hex: s.hex }))
  );
}

function meta(ramps: GeneratedRamp[], totalSteps: number): ContrastMapMeta {
  return {
    version: '1.0',
    generated: new Date().toISOString(),
    totalRamps: ramps.length,
    totalSteps,
  };
}

export function buildWcagContrastMap(ramps: GeneratedRamp[]): WcagContrastMap {
  const allSteps = buildSteps(ramps);
  const wcag: WcagContrastMap['wcag'] = { 'aa-large': [], aa: [], aaa: [] };

  for (const fg of allSteps) {
    for (const bg of allSteps) {
      if (fg.hex === bg.hex) continue;
      const wcagResult = getContrast(fg.hex, bg.hex);
      if (wcagResult.level !== 'fail') {
        const entry: WcagMapEntry = { fg, bg, ratio: Math.round(wcagResult.ratio * 100) / 100 };
        if (wcagResult.ratio >= 7) wcag.aaa.push(entry);
        else if (wcagResult.ratio >= 4.5) wcag.aa.push(entry);
        else wcag['aa-large'].push(entry);
      }
    }
  }

  return { ...meta(ramps, allSteps.length), wcag };
}

export function buildApcaContrastMap(ramps: GeneratedRamp[]): ApcaContrastMap {
  const allSteps = buildSteps(ramps);
  const apca: ApcaContrastMap['apca'] = { lc45: [], lc60: [], lc75: [] };

  for (const fg of allSteps) {
    for (const bg of allSteps) {
      if (fg.hex === bg.hex) continue;
      const lc = getApcaContrast(fg.hex, bg.hex);
      const absLc = Math.abs(lc);
      if (absLc >= 45) {
        const entry: ApcaMapEntry = { fg, bg, lc: Math.round(lc * 100) / 100 };
        if (absLc >= 75) apca.lc75.push(entry);
        else if (absLc >= 60) apca.lc60.push(entry);
        else apca.lc45.push(entry);
      }
    }
  }

  return { ...meta(ramps, allSteps.length), apca };
}

export function exportWcagContrastMapJSON(ramps: GeneratedRamp[]): string {
  return JSON.stringify(buildWcagContrastMap(ramps), null, 2);
}

export function exportApcaContrastMapJSON(ramps: GeneratedRamp[]): string {
  return JSON.stringify(buildApcaContrastMap(ramps), null, 2);
}
