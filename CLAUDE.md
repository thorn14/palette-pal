# palette-pal — Project Memory

## Tech Stack
- **React 18 + Vite 5 + TypeScript 5**
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (zero config, `@import "tailwindcss"` in index.css)
- **Zustand 4 + immer** — store in `src/store/paletteStore.ts`
- **culori ^3.3.0** — all color math (`parse`, `formatHex`, `oklch`, `wcagContrast`, `clampChroma`)

## Run Commands
```bash
npm run dev    # Vite dev server
npm run build  # Production build
npm run lint   # ESLint
```

## Key Conventions
- **No derived state in store** — `GeneratedRamp` is always computed via `useMemo` in hooks
- **culori used directly** — not the color-converter library
- **immer middleware** for nested mutations in store actions
- **Tailwind utilities only** — no separate CSS modules or styled-components
- Source-of-truth: `ColorScale[]` in Zustand store; everything else is derived

## Architecture — Data Flow
```
sourceHex → hexToOklch() → ColorScale.sourceOklch
         → buildDefaultCurves() → ColorScale.curves
         → [user edits curves + hue shift]
         → generateRamp() → GeneratedStep[] (useMemo via useGeneratedRamp)
         → RampRow renders swatches
         → AdjacentContrastRow shows step-to-step WCAG ratios
         → ContrastMatrix shows full NxN grid
         → ExportModal serializes to W3C DTCG JSON
```

## Directory Structure
```
src/
├── types/palette.ts          # ALL shared interfaces
├── constants/stepPresets.ts  # TAILWIND_STEPS, TAILWIND_LIGHTNESS, resolveStepNames
├── lib/
│   ├── colorMath.ts          # generateRamp, buildDefaultCurves, hexToOklch, getContrast
│   ├── curveInterpolation.ts # lerp, clamp, remap, linspace, monotone cubic spline
│   └── exportTokens.ts       # W3C DTCG JSON serializer
├── store/paletteStore.ts     # Zustand + immer, ColorScale[] source of truth
├── hooks/
│   ├── useGeneratedRamp.ts   # useMemo: ColorScale → GeneratedRamp
│   └── useContrastMatrix.ts  # useMemo: GeneratedRamp → ContrastCell[][]
└── components/
    ├── layout/               # Sidebar, TopBar
    ├── input/                # ColorInput, StepNamingSelect
    ├── curves/               # CurveEditor, CurveTrack, CurvePreview
    ├── ramp/                 # RampRow, Swatch, HueShiftControls
    ├── accessibility/        # ContrastBadge, AdjacentContrastRow, ContrastMatrix
    ├── preview/              # PalettePreview
    └── export/               # ExportModal
```

## Lightness Reference (from color-converter)
Tailwind 50–950 lightness in OKLCH (index 0 = lightest):
`[0.9927, 0.9745, 0.9344, 0.8511, 0.7623, 0.6548, 0.5388, 0.4115, 0.2991, 0.2215, 0.196]`

## Build Checklist
- [x] 0. CLAUDE.md
- [x] 1. src/types/palette.ts
- [x] 2. src/constants/stepPresets.ts
- [x] 3. src/lib/colorMath.ts
- [x] 4. src/lib/curveInterpolation.ts + exportTokens.ts
- [x] 5. src/store/paletteStore.ts
- [x] 6. src/hooks/useGeneratedRamp.ts + useContrastMatrix.ts
- [x] 7. Primitive components (Swatch, ContrastBadge, CurveTrack, CurvePreview)
- [x] 8. Composite components (RampRow, CurveEditor, AdjacentContrastRow)
- [x] 9. Page-level (PalettePreview, ContrastMatrix, ExportModal)
- [x] 10. Layout (Sidebar, TopBar, App.tsx)
- [x] 11. Entry (main.tsx, index.css, vite.config.ts)
