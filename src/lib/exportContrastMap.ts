import { getContrast, getApcaContrast } from './colorMath';
import type { GeneratedRamp, ContrastMapOutput, WcagMapEntry, ApcaMapEntry } from '../types/palette';

export function buildContrastMap(ramps: GeneratedRamp[]): ContrastMapOutput {
  const allSteps = ramps.flatMap((r) =>
    r.steps.map((s) => ({ ramp: r.scaleName, step: s.name, hex: s.hex }))
  );

  const wcag: { 'aa-large': WcagMapEntry[]; aa: WcagMapEntry[]; aaa: WcagMapEntry[] } = {
    'aa-large': [],
    aa: [],
    aaa: [],
  };
  const apca: { lc45: ApcaMapEntry[]; lc60: ApcaMapEntry[]; lc75: ApcaMapEntry[] } = {
    lc45: [],
    lc60: [],
    lc75: [],
  };

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

  return {
    version: '1.0',
    generated: new Date().toISOString(),
    totalRamps: ramps.length,
    totalSteps: allSteps.length,
    wcag,
    apca,
  };
}

export function exportContrastMapJSON(ramps: GeneratedRamp[]): string {
  return JSON.stringify(buildContrastMap(ramps), null, 2);
}
