# Palette Pal

A client-side-only color palette generator built with React, Vite, and TypeScript.

## Cursor Cloud specific instructions

### Overview

Single-service SPA — no backend, database, or external dependencies. The only process needed is the Vite dev server.

### Commands

See `package.json` scripts and `README.md` for the standard commands (`npm run dev`, `npm run build`, `npm run lint`).

### Caveats

- The Vite config (`vite.config.ts`) sets `server.open: true` by default. In headless/cloud environments, start with `npx vite --open false` or override via CLI flags to avoid errors.
- `npm run lint` has 4 pre-existing ESLint errors (2× `set-state-in-effect` in `RightPanel.tsx`, 2× `rules-of-hooks` in `PaletteColorWheel.tsx`). These are known issues in the existing code.
- No test framework is configured — there are no automated tests to run.
- The save-to-disk feature (Save button → "Save to project") uses a Vite dev-server middleware endpoint (`POST /__save-color-tokens`) that writes to `src/color-tokens.json`. This only works during `npm run dev`, not in production builds.
