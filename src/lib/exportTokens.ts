import type { GeneratedRamp, W3CTokenGroup, W3CTokenValue, W3CColorValue } from '../types/palette';

function buildColorValue(step: GeneratedRamp['steps'][number]): W3CColorValue {
  const value: W3CColorValue = {
    colorSpace: 'oklch',
    components: [
      parseFloat(step.oklch.l.toFixed(6)),
      parseFloat(step.oklch.c.toFixed(6)),
      parseFloat(step.oklch.h.toFixed(4)),
    ],
    hex: step.hex,
  };
  const alpha = step.oklch.alpha ?? 1;
  if (alpha < 1) value.alpha = parseFloat(alpha.toFixed(4));
  return value;
}

export function exportToW3CTokens(ramps: GeneratedRamp[]): W3CTokenGroup {
  const root: W3CTokenGroup = {};

  for (const ramp of ramps) {
    const group: Record<string, unknown> = { $type: 'color' };

    for (const step of ramp.steps) {
      const token: W3CTokenValue = {
        $value: buildColorValue(step),
      };
      group[step.name] = token;
    }

    root[ramp.scaleName] = group as W3CTokenGroup;
  }

  return root;
}

export function exportToJSON(ramps: GeneratedRamp[]): string {
  return JSON.stringify(exportToW3CTokens(ramps), null, 2);
}
