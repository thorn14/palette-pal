/**
 * Export palette-pal color-tokens.json to W3C Design Tokens format.
 * Run: pnpm exec tsx scripts/export-tokens.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateRamp } from '../src/lib/colorMath';
import { exportToW3CTokens } from '../src/lib/exportTokens';
import type { ColorScale } from '../src/types/palette';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const tokensPath = resolve(projectRoot, 'src/color-tokens.json');
const outputPath = resolve(projectRoot, 'color-tokens-export.json');

const config = JSON.parse(readFileSync(tokensPath, 'utf-8')) as {
  version?: number;
  scales?: ColorScale[];
  palettes?: { scales: ColorScale[] }[];
};

const scales: ColorScale[] = config.version === 2
  ? (config.palettes ?? []).flatMap((p) => (Array.isArray(p.scales) ? p.scales : []))
  : config.scales ?? [];
const ramps = scales.map((s) => generateRamp(s));
const tokens = exportToW3CTokens(ramps);

writeFileSync(outputPath, JSON.stringify(tokens, null, 2), 'utf-8');
console.log(`Exported ${ramps.length} color ramps to ${outputPath}`);
