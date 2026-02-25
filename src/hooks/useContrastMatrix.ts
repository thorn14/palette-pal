import type { GeneratedRamp, ContrastResult } from '../types/palette';
import { getContrast } from '../lib/colorMath';

export interface ContrastCell {
  rowStep: string;
  colStep: string;
  result: ContrastResult;
}

// Returns NxN grid of contrast results for steps within a single ramp
export function useContrastMatrix(ramp: GeneratedRamp): ContrastCell[][] {
  const { steps } = ramp;
  return steps.map((rowStep) =>
    steps.map((colStep) => ({
      rowStep: rowStep.name,
      colStep: colStep.name,
      result: getContrast(rowStep.hex, colStep.hex),
    }))
  );
}

// Adjacent step contrasts (step i vs step i+1)
export function useAdjacentContrasts(ramp: GeneratedRamp): ContrastResult[] {
  const { steps } = ramp;
  const results: ContrastResult[] = [];
  for (let i = 0; i < steps.length - 1; i++) {
    results.push(getContrast(steps[i].hex, steps[i + 1].hex));
  }
  return results;
}
