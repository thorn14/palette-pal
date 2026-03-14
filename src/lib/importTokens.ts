import { parse, formatHex, converter } from 'culori';
import type { OklchColor } from '../types/palette';

const toOklch = converter('oklch');

export interface ImportedStep {
  name: string;
  hex: string;
  oklch: OklchColor;
}

export interface ImportedScale {
  name: string;
  steps: ImportedStep[];
  sourceHex: string;
  sourceOklch: OklchColor;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function resolveHexFromValue(val: unknown): string | null {
  if (typeof val === 'string') {
    const parsed = parse(val);
    return parsed ? (formatHex(parsed) ?? null) : null;
  }

  if (isObj(val)) {
    if (typeof val.hex === 'string') {
      const parsed = parse(val.hex);
      if (parsed) return formatHex(parsed) ?? null;
    }

    if (typeof val.colorSpace === 'string' && Array.isArray(val.components)) {
      const cs = val.colorSpace;
      const comps = val.components.map((c: unknown) =>
        c === 'none' ? 0 : typeof c === 'number' ? c : 0
      );
      const alpha = typeof val.alpha === 'number' ? val.alpha : 1;

      try {
        const culoriColor = { mode: cs, ...spreadComponents(cs, comps), alpha } as Parameters<typeof formatHex>[0];
        const hex = formatHex(culoriColor);
        return hex ?? null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function spreadComponents(colorSpace: string, comps: number[]): Record<string, number> {
  switch (colorSpace) {
    case 'oklch':
      return { l: comps[0] ?? 0, c: comps[1] ?? 0, h: comps[2] ?? 0 };
    case 'oklab':
      return { l: comps[0] ?? 0, a: comps[1] ?? 0, b: comps[2] ?? 0 };
    case 'lch':
      return { l: comps[0] ?? 0, c: comps[1] ?? 0, h: comps[2] ?? 0 };
    case 'lab':
      return { l: comps[0] ?? 0, a: comps[1] ?? 0, b: comps[2] ?? 0 };
    case 'hsl':
      return { h: comps[0] ?? 0, s: comps[1] ?? 0, l: comps[2] ?? 0 };
    case 'hwb':
      return { h: comps[0] ?? 0, w: comps[1] ?? 0, b: comps[2] ?? 0 };
    case 'srgb':
    case 'srgb-linear':
    case 'display-p3':
    case 'a98-rgb':
    case 'prophoto-rgb':
    case 'rec2020':
      return { r: comps[0] ?? 0, g: comps[1] ?? 0, b: comps[2] ?? 0 };
    default:
      return { r: comps[0] ?? 0, g: comps[1] ?? 0, b: comps[2] ?? 0 };
  }
}

function hexToOklchSafe(hex: string): OklchColor {
  const parsed = parse(hex);
  if (!parsed) return { l: 0, c: 0, h: 0 };
  const o = toOklch(parsed);
  if (!o) return { l: 0, c: 0, h: 0 };
  return { l: o.l ?? 0, c: o.c ?? 0, h: o.h ?? 0, alpha: o.alpha };
}

function isToken(obj: Record<string, unknown>): boolean {
  return '$value' in obj;
}

function inheritsColorType(obj: Record<string, unknown>, parentType?: string): string | undefined {
  if (typeof obj.$type === 'string') return obj.$type;
  return parentType;
}

/**
 * Recursively walk the JSON tree and collect groups of color tokens.
 * A "group" is any object that contains child tokens with type "color".
 */
function collectColorGroups(
  node: Record<string, unknown>,
  path: string[],
  parentType: string | undefined,
  results: Map<string, ImportedStep[]>,
) {
  const groupType = inheritsColorType(node, parentType);

  const localTokens: ImportedStep[] = [];
  const childGroups: Array<[string, Record<string, unknown>]> = [];

  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (!isObj(value)) continue;

    if (isToken(value)) {
      const tokenType = inheritsColorType(value, groupType);
      if (tokenType !== 'color') continue;

      const hex = resolveHexFromValue(value.$value);
      if (!hex) continue;

      localTokens.push({
        name: key,
        hex,
        oklch: hexToOklchSafe(hex),
      });
    } else {
      childGroups.push([key, value]);
    }
  }

  if (localTokens.length > 0) {
    results.set(path.join('.') || 'root', localTokens);
  }

  for (const [key, child] of childGroups) {
    collectColorGroups(child, [...path, key], groupType, results);
  }
}

function pickSourceStep(steps: ImportedStep[]): ImportedStep {
  const midIdx = Math.floor(steps.length / 2);

  const named500 = steps.find((s) => s.name === '500');
  if (named500) return named500;

  return steps[midIdx] ?? steps[0];
}

export function parseW3CTokens(json: string): ImportedScale[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON');
  }
  if (!isObj(data)) throw new Error('Expected a JSON object at the root');

  const groups = new Map<string, ImportedStep[]>();
  collectColorGroups(data, [], undefined, groups);

  if (groups.size === 0) throw new Error('No color tokens found in the file');

  const scales: ImportedScale[] = [];

  for (const [path, steps] of groups) {
    const parts = path.split('.');
    const name = parts[parts.length - 1] || 'Imported';
    const source = pickSourceStep(steps);

    scales.push({
      name,
      steps,
      sourceHex: source.hex,
      sourceOklch: source.oklch,
    });
  }

  return scales;
}
