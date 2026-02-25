import type { GeneratedRamp, W3CTokenGroup, W3CTokenValue } from '../types/palette';

// Serialize generated ramps to W3C DTCG JSON format
export function exportToW3CTokens(ramps: GeneratedRamp[]): W3CTokenGroup {
  const root: W3CTokenGroup = {};

  for (const ramp of ramps) {
    const group: W3CTokenGroup = { $type: 'color' } as unknown as W3CTokenGroup;

    for (const step of ramp.steps) {
      const oklchDesc = `oklch(${step.oklch.l.toFixed(4)} ${step.oklch.c.toFixed(4)} ${step.oklch.h.toFixed(2)})`;
      const token: W3CTokenValue = {
        $value: step.hex,
        $type: 'color',
        $description: oklchDesc,
      };
      (group as Record<string, unknown>)[step.name] = token;
    }

    root[ramp.scaleName] = group;
  }

  return root;
}

export function exportToJSON(ramps: GeneratedRamp[]): string {
  return JSON.stringify(exportToW3CTokens(ramps), null, 2);
}
