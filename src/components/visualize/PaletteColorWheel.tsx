import { useMemo, useState } from 'react';
import { generateRamp } from '../../lib/colorMath';
import { usePaletteStore } from '../../store/paletteStore';


function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  // -90 offset so hue 0 (red) is at top
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function PaletteColorWheel() {
  const scales = usePaletteStore((s) => s.scales);
  const [selectedScaleId, setSelectedScaleId] = useState<string | null>(null);

  if (scales.length === 0) {
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

  const size = 480;
  const center = size / 2;
  const innerRadius = 40;
  const outerRadius = 200;
  const maxChroma = 0.25; // OKLCH chroma range for positioning on wheel

  const ramps = useMemo(() => scales.map((s) => generateRamp(s)), [scales]);

  const markers = useMemo(() => {
    const out: Array<{
      scaleId: string;
      scaleName: string;
      stepName: string;
      hex: string;
      x: number;
      y: number;
    }> = [];
    for (const ramp of ramps) {
      const scale = scales.find((s) => s.id === ramp.scaleId);
      if (!scale) continue;
      for (const step of ramp.steps) {
        const { h, c } = step.oklch;
        const t = Math.min(1, c / maxChroma);
        const radius = innerRadius + t * (outerRadius - innerRadius);
        const { x, y } = polarToCartesian(center, center, radius, h);
        out.push({
          scaleId: ramp.scaleId,
          scaleName: ramp.scaleName,
          stepName: step.name,
          hex: step.hex,
          x,
          y,
        });
      }
    }
    return out;
  }, [ramps, scales, center, innerRadius, outerRadius, maxChroma]);

  const markerRadius = markers.length > 20 ? 8 : 12;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 'min(calc(100% - 48px), calc(100vh - 180px))',
          aspectRatio: '1',
          flexShrink: 0,
        }}
      >
        {/* Classic color wheel: hue ring + saturation fade from center */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `
              radial-gradient(circle at 50% 50%, white 0%, transparent 65%),
              conic-gradient(from -90deg, 
                #ff0000 0deg, #ff8000 30deg, #ffff00 60deg, #80ff00 90deg, 
                #00ff00 120deg, #00ff80 150deg, #00ffff 180deg, #0080ff 210deg,
                #0000ff 240deg, #8000ff 270deg, #ff00ff 300deg, #ff0080 330deg,
                #ff0000 360deg)
            `,
            border: '2px solid var(--p-border)',
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        />

        {/* Markers for each scale origin */}
        <svg
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Palette color wheel"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <defs>
            <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
            </filter>
          </defs>
          {markers.map((m) => {
            const isSelected = !selectedScaleId || selectedScaleId === m.scaleId;
            const opacity = isSelected ? 1 : 0.2;
            return (
              <g
                key={`${m.scaleId}-${m.stepName}`}
                style={{ pointerEvents: 'auto', cursor: 'pointer', opacity }}
                onMouseEnter={() => setSelectedScaleId(m.scaleId)}
                onFocus={() => setSelectedScaleId(m.scaleId)}
              >
                <title>{`${m.scaleName} ${m.stepName} · ${m.hex}`}</title>
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={markerRadius}
                  fill={m.hex}
                  stroke="white"
                  strokeWidth={2}
                  filter="url(#marker-shadow)"
                />
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={markerRadius + 2}
                  fill="none"
                  stroke="var(--p-border)"
                  strokeWidth={1}
                  opacity={0.6}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tags: scale name, click to filter */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {ramps.map((ramp) => {
          const isSelected = selectedScaleId === ramp.scaleId;
          return (
            <button
              key={ramp.scaleId}
              type="button"
              onMouseEnter={() => setSelectedScaleId(ramp.scaleId)}
              onClick={() => setSelectedScaleId(isSelected ? null : ramp.scaleId)}
              className="focus-visible-ring"
              style={{
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 500,
                color: isSelected ? 'var(--p-text)' : 'var(--p-text-secondary)',
                background: isSelected ? 'var(--p-bg-inset)' : 'var(--p-bg-subtle)',
                border: `1px solid ${isSelected ? 'var(--p-border)' : 'transparent'}`,
                borderRadius: 6,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s, color 0.15s',
              }}
            >
              {ramp.scaleName}
            </button>
          );
        })}
      </div>

    </div>
  );
}
