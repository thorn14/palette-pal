# palette-pal

A color palette generator built with React, Vite, and TypeScript. Create, customize, and export design-token-ready color ramps with WCAG contrast analysis.

## Features

- Generate smooth OKLCH-based color ramps from a source hex color
- Adjustable lightness, chroma, and hue curves per scale
- WCAG contrast badges and full NxN contrast matrix
- Export to W3C DTCG-compatible JSON design tokens

## Tech Stack

- **React 18 + Vite 5 + TypeScript 5**
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **Zustand 4 + immer** for state management
- **culori** for all color math (OKLCH, WCAG contrast)

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev    # Vite dev server
npm run build  # Production build
npm run lint   # ESLint
```
