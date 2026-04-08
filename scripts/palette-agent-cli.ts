/**
 * palette-agent-cli.ts
 *
 * CLI wrapper that accepts a natural language description and generates a color
 * palette using any OpenAI-compatible LLM. The LLM calls the `create_palette`
 * tool to return structured parameters, which are then fed into the existing
 * palette-pal color math pipeline.
 *
 * Run:
 *   pnpm palette "warm terracotta sunset palette"
 *   pnpm palette --format tokens "ocean blue for a SaaS dashboard"
 *   echo "forest green" | pnpm palette --base-url http://localhost:11434/v1 --api-key ollama --model llama3.2
 *
 * Provider examples:
 *   OpenAI (default):  --model gpt-4o  (OPENAI_API_KEY)
 *   Anthropic:         --base-url https://api.anthropic.com/v1 --model claude-opus-4-6
 *   Groq:              --base-url https://api.groq.com/openai/v1 --model llama-3.3-70b-versatile
 *   Ollama:            --base-url http://localhost:11434/v1 --api-key ollama --model llama3.2
 *   OpenRouter:        --base-url https://openrouter.ai/api/v1 --model anthropic/claude-opus-4
 */

import { readFileSync } from 'fs';
import { Command } from 'commander';
import OpenAI from 'openai';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { hexToOklch, buildDefaultCurves, buildChromaCurve, generateRamp } from '../src/lib/colorMath';
import { exportToW3CTokens } from '../src/lib/exportTokens';
import { buildLightnessValues } from '../src/constants/stepPresets';
import type { ColorScale } from '../src/types/palette';

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_palette',
      description:
        "Create a color palette based on the user's natural language description. " +
        'Call this tool with parameters that produce a well-crafted, accessible color ramp.',
      parameters: {
        type: 'object',
        required: ['name', 'sourceHex'],
        properties: {
          name: {
            type: 'string',
            description: "Short kebab-case palette name (e.g. 'terracotta', 'ocean-blue')",
          },
          sourceHex: {
            type: 'string',
            description: 'Hex color for the base/midpoint of the ramp (e.g. #E07B54)',
          },
          stepCount: {
            type: 'number',
            description: 'Number of steps in the ramp. Default: 11.',
          },
          lightnessPreset: {
            type: 'string',
            enum: ['tailwind', 'linear', 'eased', 'material'],
            description:
              'Lightness distribution curve. ' +
              'tailwind = standard design-system (default), ' +
              'linear = even spread, ' +
              'eased = smooth S-curve, ' +
              'material = Google Material Design 3.',
          },
          chromaPeak: {
            type: 'number',
            description:
              'Peak saturation 0.0–0.4. ' +
              'Vivid/saturated colors: 0.25–0.35. ' +
              'Muted/neutral colors: 0.08–0.18. ' +
              'Omit to auto-derive from source color.',
          },
          namingPreset: {
            type: 'string',
            enum: ['tailwind', 'numeric'],
            description:
              'Step naming convention. ' +
              'tailwind = 50/100/200/.../950 (default for design systems). ' +
              'numeric = 1/2/.../11.',
          },
          hueShiftLight: {
            type: 'number',
            description: 'Extra hue-shift adjustment at the light end, in degrees. Default: 0.',
          },
          hueShiftDark: {
            type: 'number',
            description: 'Extra hue-shift adjustment at the dark end, in degrees. Default: 0.',
          },
          rationale: {
            type: 'string',
            description: 'One or two sentences explaining the color and parameter choices.',
          },
        },
      },
    },
  },
];

const SYSTEM_PROMPT = `You are a professional color designer specializing in design system color ramps.
When given a natural language palette description, call the create_palette tool with parameters
that produce a well-crafted, accessible color palette.

Guidelines:
- Choose sourceHex as the core/midpoint of the described color (not the lightest or darkest shade).
- Match chromaPeak to the intended vibrancy: vivid/saturated colors use 0.25–0.35, neutral/muted use 0.08–0.18.
- Default to lightnessPreset "tailwind" and namingPreset "tailwind" for standard design systems.
- Use "material" preset for Google Material Design contexts.
- Always include a concise rationale explaining your choices.
- You MUST call the create_palette tool — do not respond with plain text.`;

// ---------------------------------------------------------------------------
// Palette builder (wires LLM params → color math)
// ---------------------------------------------------------------------------

interface PaletteParams {
  name: string;
  sourceHex: string;
  stepCount?: number;
  lightnessPreset?: 'tailwind' | 'linear' | 'eased' | 'material';
  chromaPeak?: number;
  namingPreset?: 'tailwind' | 'numeric';
  hueShiftLight?: number;
  hueShiftDark?: number;
  rationale?: string;
}

function buildScale(params: PaletteParams, stepOverride?: number): ColorScale {
  const sourceOklch = hexToOklch(params.sourceHex);
  const stepCount = stepOverride ?? params.stepCount ?? 11;
  const lightnessPreset = params.lightnessPreset ?? 'tailwind';
  const chromaPeak = params.chromaPeak ?? sourceOklch.c;

  const curves = buildDefaultCurves(sourceOklch, stepCount);

  // Apply non-tailwind lightness preset (buildDefaultCurves uses tailwind by default)
  if (lightnessPreset !== 'tailwind') {
    curves.lightness.values = buildLightnessValues(lightnessPreset, stepCount);
  }

  // Override chroma peak if explicitly provided
  if (params.chromaPeak != null) {
    curves.chroma.values = buildChromaCurve(params.chromaPeak, stepCount);
  }

  return {
    id: crypto.randomUUID(),
    name: params.name,
    sourceHex: params.sourceHex,
    sourceOklch,
    sourceAlpha: 1,
    stepCount,
    naming: { preset: params.namingPreset ?? 'tailwind' },
    curves,
    hueShift: {
      lightEndAdjust: params.hueShiftLight ?? 0,
      darkEndAdjust: params.hueShiftDark ?? 0,
    },
    lightnessPreset,
    chromaPeak,
  };
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

type OutputFormat = 'steps' | 'tokens' | 'full';

function formatOutput(
  ramp: ReturnType<typeof generateRamp>,
  params: PaletteParams,
  format: OutputFormat,
): unknown {
  if (format === 'tokens') {
    return exportToW3CTokens([ramp]);
  }

  const steps = ramp.steps.map((s) => ({
    name: s.name,
    hex: s.hex,
    oklch: { l: s.oklch.l, c: s.oklch.c, h: s.oklch.h },
    gamut: s.gamut,
  }));

  if (format === 'steps') {
    return {
      palette: params.name,
      sourceHex: params.sourceHex,
      rationale: params.rationale ?? '',
      steps,
    };
  }

  // full
  return {
    palette: params.name,
    sourceHex: params.sourceHex,
    rationale: params.rationale ?? '',
    params,
    steps,
    tokens: exportToW3CTokens([ramp]),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const program = new Command();

  program
    .name('palette-agent-cli')
    .description(
      'Generate a color palette from a natural language description using any OpenAI-compatible LLM.',
    )
    .argument('[prompt]', 'Natural language palette description (or pipe via stdin)')
    .option('--format <format>', 'Output format: steps | tokens | full', 'steps')
    .option('--steps <n>', 'Override number of palette steps', parseInt)
    .option('--model <id>', 'LLM model ID', 'gpt-4o')
    .option('--base-url <url>', 'LLM API base URL (defaults to OpenAI)')
    .option('--api-key <key>', 'API key (falls back to OPENAI_API_KEY env var)')
    .parse(process.argv);

  const opts = program.opts<{
    format: string;
    steps?: number;
    model: string;
    baseUrl?: string;
    apiKey?: string;
  }>();

  // Resolve prompt from args or stdin
  let prompt: string = program.args[0] ?? '';
  if (!prompt && !process.stdin.isTTY) {
    prompt = readFileSync('/dev/stdin', 'utf-8').trim();
  }

  if (!prompt) {
    process.stderr.write('Error: No prompt provided. Pass a description as an argument or pipe via stdin.\n');
    process.exit(1);
  }

  // Validate format
  const format = opts.format as OutputFormat;
  if (!['steps', 'tokens', 'full'].includes(format)) {
    process.stderr.write(`Error: Invalid --format "${format}". Choose steps | tokens | full.\n`);
    process.exit(1);
  }

  // Resolve API key
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    process.stderr.write(
      'Error: No API key provided. Set OPENAI_API_KEY or pass --api-key.\n',
    );
    process.exit(1);
  }

  // Build OpenAI client (works with any OpenAI-compatible provider)
  const client = new OpenAI({
    apiKey,
    ...(opts.baseUrl ? { baseURL: opts.baseUrl } : {}),
  });

  // Call LLM with tool use
  process.stderr.write(`Calling ${opts.model}${opts.baseUrl ? ` (${opts.baseUrl})` : ''}...\n`);

  let response: Awaited<ReturnType<typeof client.chat.completions.create>>;
  try {
    response = await client.chat.completions.create({
      model: opts.model,
      tool_choice: 'required',
      tools: TOOLS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });
  } catch (err) {
    process.stderr.write(`Error: LLM request failed — ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }

  // Extract tool call
  const message = response.choices[0]?.message;
  const toolCall = message?.tool_calls?.find((tc) => tc.function.name === 'create_palette');

  if (!toolCall) {
    process.stderr.write('Error: LLM did not call the create_palette tool.\n');
    if (message?.content) {
      process.stderr.write(`Model response: ${message.content}\n`);
    }
    process.exit(1);
  }

  // Parse params
  let params: PaletteParams;
  try {
    params = JSON.parse(toolCall.function.arguments) as PaletteParams;
  } catch {
    process.stderr.write('Error: Could not parse tool call arguments as JSON.\n');
    process.exit(1);
  }

  // Build scale and generate ramp
  let scale: ColorScale;
  try {
    scale = buildScale(params, opts.steps);
  } catch (err) {
    process.stderr.write(
      `Error: Invalid color parameters — ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exit(1);
  }

  const ramp = generateRamp(scale);
  const output = formatOutput(ramp, params, format);

  process.stdout.write(JSON.stringify(output, null, 2) + '\n');
}

main();
