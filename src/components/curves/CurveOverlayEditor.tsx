import { useRef, useState, useCallback, useEffect } from 'react';

const supportsP3 = typeof CSS !== 'undefined' && CSS.supports('color', 'color(display-p3 0 0 0)');
import type { ColorScale, GeneratedRamp } from '../../types/palette';
import { usePaletteStore } from '../../store/paletteStore';
import { getContrast, computeHueShift } from '../../lib/colorMath';

type CurveKey = 'lightness' | 'chroma' | 'hue';

const CURVES: { key: CurveKey; label: string; color: string; min: number; max: number }[] = [
  { key: 'lightness', label: 'L', color: '#d97706', min: 0,    max: 1   },
  { key: 'chroma',    label: 'C', color: '#059669', min: 0,    max: 0.4 },
  { key: 'hue',       label: 'H', color: '#7c3aed', min: -180, max: 180 },
];

const WCAG_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  AAA:        { bg: 'var(--badge-aaa-bg)',  text: 'var(--badge-aaa-text)',  label: '7:1'  },
  AA:         { bg: 'var(--badge-aa-bg)',   text: 'var(--badge-aa-text)',   label: '4.5:1'},
  'AA-large': { bg: 'var(--badge-aal-bg)',  text: 'var(--badge-aal-text)',  label: '3:1'  },
  fail:       { bg: 'var(--badge-fail-bg)', text: 'var(--badge-fail-text)', label: 'Fail' },
};

interface DragState { curveKey: CurveKey; stepIndex: number }

interface Props {
  scale: ColorScale;
  ramp: GeneratedRamp;
  activeStepIndex: number | null;
  onStepClick: (idx: number) => void;
}

export function CurveOverlayEditor({ scale, ramp, activeStepIndex, onStepClick }: Props) {
  const updateCurveValue = usePaletteStore((s) => s.updateCurveValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const n = ramp.steps.length;
  const PAD = 18;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragState || !containerRef.current) return;
    const s = scaleRef.current;
    const meta = CURVES.find((c) => c.key === dragState.curveKey)!;
    const rect = containerRef.current.getBoundingClientRect();
    const norm = 1 - (e.clientY - rect.top - PAD) / (size.height - PAD * 2);
    const clamped = Math.max(0, Math.min(1, norm));
    let value = meta.min + clamped * (meta.max - meta.min);
    // For H: user drags the effective (combined) hue; store only the manual delta
    if (dragState.curveKey === 'hue') {
      const t = n <= 1 ? 0 : dragState.stepIndex / (n - 1);
      const shift = computeHueShift(s.sourceOklch.h, t, s.hueShift.lightEndAdjust, s.hueShift.darkEndAdjust);
      value = value - shift;
    }
    updateCurveValue(s.id, dragState.curveKey, dragState.stepIndex, value);
  }, [dragState, size.height, updateCurveValue, n]);

  const handlePointerUp = useCallback(() => {
    setDragState(null);
    document.body.style.cursor = '';
  }, []);

  useEffect(() => {
    if (!dragState) return;
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.body.style.cursor = 'ns-resize';
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, handlePointerMove, handlePointerUp]);

  function getPoint(value: number, stepIndex: number, min: number, max: number) {
    const norm = (value - min) / (max - min);
    const x = (stepIndex + 0.5) / n * size.width;
    const y = PAD + (1 - norm) * (size.height - PAD * 2);
    return { x, y };
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: 'var(--p-bg)' }}>

      {/* Step name headers + gamut indicators */}
      <div
        className="flex shrink-0 border-b"
        style={{ height: 40, borderColor: 'var(--p-border)' }}
      >
        {ramp.steps.map((step) => {
          const gamutLabel = step.gamut === 'p3' ? { text: 'P3', color: '#7c3aed' } : null;
          return (
            <div
              key={step.name}
              className="flex-1 flex flex-col items-center justify-center border-r last:border-r-0 gap-1"
              style={{ borderColor: 'var(--p-border)' }}
            >
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--p-text-secondary)' }}>
                {step.name}
              </span>
              {gamutLabel ? (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                  padding: '1px 4px',
                  borderRadius: 3,
                  backgroundColor: gamutLabel.color,
                  color: '#fff',
                }}>
                  {gamutLabel.text}
                </span>
              ) : (
                <span style={{ fontSize: 9, lineHeight: 1 }}>&nbsp;</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Color columns + SVG curve overlay */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-0 flex select-none"
      >
        {ramp.steps.map((step, i) => (
          <button
            key={step.name}
            onClick={() => onStepClick(i)}
            className="flex-1 relative border-r last:border-r-0 cursor-pointer"
            style={{
              backgroundColor: (supportsP3 && step.displayP3) || step.hex,
              borderColor: 'rgba(0,0,0,0.07)',
              boxShadow: activeStepIndex === i ? 'inset 0 0 0 2px rgba(255,255,255,0.9)' : undefined,
            }}
          />
        ))}

        {/* SVG curves overlay */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none', overflow: 'visible' }}
        >
          {/* P3 threshold lines — one per step, in the chroma coordinate space */}
          {ramp.steps.map((step, i) => {
            const chromaMeta = CURVES.find((c) => c.key === 'chroma')!;
            const pt = getPoint(step.maxSrgbC, i, chromaMeta.min, chromaMeta.max);
            const colW = size.width / n;
            const x1 = i * colW;
            const x2 = x1 + colW;
            return (
              <line
                key={`p3-${i}`}
                x1={x1} y1={pt.y}
                x2={x2} y2={pt.y}
                stroke="rgba(255,255,255,0.75)"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            );
          })}

          {CURVES.map((curve) => {
            // For the H curve, display the effective hue offset (manual delta + hue shift)
            // so warm/cool sliders are visually reflected in the curve
            const rawValues = scale.curves[curve.key].values;
            const values = curve.key === 'hue'
              ? rawValues.map((v, i) => {
                  const t = n <= 1 ? 0 : i / (n - 1);
                  return v + computeHueShift(scale.sourceOklch.h, t, scale.hueShift.lightEndAdjust, scale.hueShift.darkEndAdjust);
                })
              : rawValues;
            const points = values.map((v, i) => getPoint(v, i, curve.min, curve.max));
            const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');

            return (
              <g key={curve.key}>
                {/* Label on left edge */}
                {points[0] && (
                  <text
                    x={8}
                    y={points[0].y}
                    dy={4}
                    fontSize={11}
                    fontWeight={700}
                    fill={curve.color}
                    style={{ fontFamily: 'monospace' }}
                  >
                    {curve.label}
                  </text>
                )}

                {/* Connecting line */}
                <polyline
                  points={polyline}
                  fill="none"
                  stroke={curve.color}
                  strokeWidth={1.5}
                  opacity={0.9}
                />

                {/* Draggable control points */}
                {points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={dragState?.curveKey === curve.key && dragState.stepIndex === i ? 6 : 4.5}
                    fill="white"
                    stroke={curve.color}
                    strokeWidth={2}
                    style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setDragState({ curveKey: curve.key, stepIndex: i });
                    }}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* WCAG badges row */}
      <div
        className="flex shrink-0 border-t"
        style={{ height: 34, borderColor: 'var(--p-border)' }}
      >
        {ramp.steps.map((step, i) => {
          const activeHex =
            activeStepIndex !== null ? ramp.steps[activeStepIndex]?.hex : null;

          let result;
          if (activeHex !== null && i !== activeStepIndex) {
            result = getContrast(step.hex, activeHex);
          } else if (activeStepIndex === null) {
            const cw = getContrast(step.hex, '#ffffff');
            const cb = getContrast(step.hex, '#000000');
            result = cw.ratio > cb.ratio ? cw : cb;
          } else {
            result = null; // the selected step itself
          }

          const s = result ? (WCAG_STYLES[result.level] ?? WCAG_STYLES.fail) : null;

          return (
            <div
              key={step.name}
              className="flex-1 flex items-center justify-center border-r last:border-r-0"
              style={{ borderColor: 'var(--p-border)' }}
            >
              {s ? (
                <span
                  title={result ? `${result.ratio.toFixed(2)}:1` : undefined}
                  style={{
                    backgroundColor: s.bg,
                    color: s.text,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 5px',
                    borderRadius: 3,
                    cursor: 'default',
                  }}
                >
                  {s.label}
                </span>
              ) : (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: 'var(--p-border)',
                    display: 'block',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
