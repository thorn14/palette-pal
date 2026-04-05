import { useMemo, useState } from 'react';
import { generateRamp } from '../../lib/colorMath';
import { usePaletteStore } from '../../store/paletteStore';

interface HoveredSlice {
  scaleName: string;
  stepName: string;
  hex: string;
}

function polarPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeRing(cx: number, cy: number, innerRadius: number, outerRadius: number) {
  const outerTop = polarPoint(cx, cy, outerRadius, -90);
  const outerBottom = polarPoint(cx, cy, outerRadius, 90);
  const innerTop = polarPoint(cx, cy, innerRadius, -90);
  const innerBottom = polarPoint(cx, cy, innerRadius, 90);

  return [
    `M ${outerTop.x} ${outerTop.y}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 ${outerBottom.x} ${outerBottom.y}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 ${outerTop.x} ${outerTop.y}`,
    `L ${innerTop.x} ${innerTop.y}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 ${innerBottom.x} ${innerBottom.y}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 ${innerTop.x} ${innerTop.y}`,
    'Z',
  ].join(' ');
}

function describeDonutSlice(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const sweep = endAngle - startAngle;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = polarPoint(cx, cy, outerRadius, endAngle);
  const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
  const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export function PaletteDonutChart() {
  const scales = usePaletteStore((s) => s.scales);
  const ramps = useMemo(() => scales.map((scale) => generateRamp(scale)), [scales]);
  const [hovered, setHovered] = useState<HoveredSlice | null>(null);

  if (ramps.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          fontSize: 14,
          color: 'var(--p-text-secondary)',
        }}
      >
        No color scales yet. Add one from the sidebar.
      </div>
    );
  }

  const size = 560;
  const center = size / 2;
  const outerRadius = 250;
  const ringGap = 2;
  const ringCount = ramps.length;
  const targetRingWidth = 18;
  const computedHole = outerRadius - ringCount * targetRingWidth - (ringCount - 1) * ringGap;
  const holeRadius = Math.max(60, Math.min(120, computedHole));
  const ringWidth = (outerRadius - holeRadius - (ringCount - 1) * ringGap) / ringCount;
  const totalSwatches = ramps.reduce((sum, ramp) => sum + ramp.steps.length, 0);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        padding: 20,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: 'min(100%, 920px)', display: 'grid', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            border: '1px solid var(--p-border)',
            borderRadius: 10,
            background: 'var(--p-bg-subtle)',
            padding: 12,
          }}
        >
          <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 640, aspectRatio: '1 / 1' }} role="img" aria-label="Palette donut chart">
            {ramps.map((ramp, ringIndex) => {
              const ringOuter = outerRadius - ringIndex * (ringWidth + ringGap);
              const ringInner = ringOuter - ringWidth;
              const stepCount = ramp.steps.length;
              const stepSweep = 360 / stepCount;
              const gap = stepCount > 1 ? Math.min(1.2, stepSweep * 0.2) : 0;

              return ramp.steps.map((step, stepIndex) => {
                const sliceStart = -90 + stepIndex * stepSweep + gap / 2;
                const sliceEnd = -90 + (stepIndex + 1) * stepSweep - gap / 2;
                const path =
                  stepCount === 1
                    ? describeRing(center, center, ringInner, ringOuter)
                    : describeDonutSlice(center, center, ringInner, ringOuter, sliceStart, sliceEnd);

                return (
                  <path
                    key={`${ramp.scaleId}-${step.name}`}
                    role="button"
                    aria-label={`${ramp.scaleName} ${step.name}: ${step.hex}`}
                    d={path}
                    fill={step.hex}
                    stroke="var(--p-bg)"
                    strokeWidth={0.5}
                    onMouseEnter={() => setHovered({ scaleName: ramp.scaleName, stepName: step.name, hex: step.hex })}
                    onFocus={() => setHovered({ scaleName: ramp.scaleName, stepName: step.name, hex: step.hex })}
                    onMouseLeave={() => setHovered(null)}
                    onBlur={() => setHovered(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setHovered({ scaleName: ramp.scaleName, stepName: step.name, hex: step.hex });
                      }
                    }}
                    tabIndex={0}
                  >
                    <title>{`${ramp.scaleName} ${step.name}: ${step.hex}`}</title>
                  </path>
                );
              });
            })}

            <circle
              cx={center}
              cy={center}
              r={Math.max(10, holeRadius - 3)}
              fill="var(--p-bg)"
              stroke="var(--p-border)"
              strokeWidth={1}
            />
            <text
              x={center}
              y={center - 8}
              textAnchor="middle"
              style={{ fill: 'var(--p-text)', fontSize: 20, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            >
              {hovered?.hex ?? `${totalSwatches} HEX`}
            </text>
            <text
              x={center}
              y={center + 14}
              textAnchor="middle"
              style={{ fill: 'var(--p-text-secondary)', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            >
              {hovered ? `${hovered.scaleName} ${hovered.stepName}` : `${ringCount} scales mapped`}
            </text>
          </svg>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          {ramps.map((ramp, ringIndex) => {
            const gradient = `linear-gradient(90deg, ${ramp.steps.map((step) => step.hex).join(', ')})`;
            return (
              <div
                key={ramp.scaleId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '96px 1fr 80px',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 12,
                  color: 'var(--p-text-secondary)',
                }}
              >
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  Ring {ringIndex + 1}
                </span>
                <div
                  title={ramp.scaleName}
                  style={{
                    borderRadius: 999,
                    border: '1px solid var(--p-border)',
                    height: 10,
                    background: gradient,
                  }}
                />
                <span
                  style={{
                    color: 'var(--p-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ramp.scaleName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
