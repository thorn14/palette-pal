// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Normalize a value from [inMin, inMax] to [outMin, outMax]
export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, clamp(t, 0, 1));
}

// Generate evenly spaced values between start and end (inclusive), count points
export function linspace(start: number, end: number, count: number): number[] {
  if (count <= 1) return [start];
  return Array.from({ length: count }, (_, i) => lerp(start, end, i / (count - 1)));
}

// Monotone cubic spline interpolation for smooth curve preview
// Returns a function that interpolates the given points
export function buildMonotoneCubicInterpolant(xs: number[], ys: number[]): (x: number) => number {
  const n = xs.length;
  if (n < 2) return () => ys[0] ?? 0;

  // Compute slopes
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }

  // Tangents
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = (d[i - 1] + d[i]) / 2;
  }

  // Monotonicity constraints (Fritsch–Carlson)
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(d[i]) < 1e-10) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / d[i];
      const beta = m[i + 1] / d[i];
      const r = alpha * alpha + beta * beta;
      if (r > 9) {
        const t = 3 / Math.sqrt(r);
        m[i] = t * alpha * d[i];
        m[i + 1] = t * beta * d[i];
      }
    }
  }

  return (x: number): number => {
    // Binary search for segment
    let lo = 0, hi = n - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid; else hi = mid;
    }
    const h = xs[hi] - xs[lo];
    const t = h === 0 ? 0 : (x - xs[lo]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo] +
      (t3 - 2 * t2 + t) * h * m[lo] +
      (-2 * t3 + 3 * t2) * ys[hi] +
      (t3 - t2) * h * m[hi]
    );
  };
}
