import { usePaletteStore } from '../../store/paletteStore';
import { useGeneratedRamp } from '../../hooks/useGeneratedRamp';
import type { ColorScale } from '../../types/palette';

function PreviewRow({ scale, colCount }: { scale: ColorScale; colCount: number }) {
  const ramp = useGeneratedRamp(scale);
  return (
    <>
      {ramp.steps.slice(0, colCount).map((step) => (
        <div
          key={step.name}
          title={`${scale.name} ${step.name}\n${step.hex}`}
          style={{ backgroundColor: step.hex, height: 48 }}
        />
      ))}
    </>
  );
}

function HeaderRow({ scale }: { scale: ColorScale }) {
  const ramp = useGeneratedRamp(scale);
  return (
    <>
      {ramp.steps.map((step) => (
        <div
          key={step.name}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'var(--p-text-secondary)',
            borderRight: '1px solid var(--p-border)',
          }}
        >
          {step.name}
        </div>
      ))}
    </>
  );
}

export function PalettePreview() {
  const scales = usePaletteStore((s) => s.scales);
  const firstScale = scales[0];

  if (!firstScale) {
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

  const colCount = firstScale.stepCount;

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Scale name labels */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--p-border)',
          flexShrink: 0,
          background: 'var(--p-bg-subtle)',
        }}
      >
        {/* Spacer for header row */}
        <div style={{ height: 28, borderBottom: '1px solid var(--p-border)' }} />
        {scales.map((scale) => (
          <div
            key={scale.id}
            style={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              paddingInline: 12,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'monospace',
              color: 'var(--p-text)',
              borderBottom: '1px solid var(--p-border)',
              whiteSpace: 'nowrap',
              minWidth: 80,
            }}
          >
            {scale.name}
          </div>
        ))}
      </div>

      {/* Grid area */}
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {/* Step name header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            height: 28,
            borderBottom: '1px solid var(--p-border)',
            background: 'var(--p-bg-subtle)',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <HeaderRow scale={firstScale} />
        </div>

        {/* Color rows */}
        {scales.map((scale) => (
          <div
            key={scale.id}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${colCount}, 1fr)`,
              borderBottom: '1px solid var(--p-border)',
            }}
          >
            <PreviewRow scale={scale} colCount={colCount} />
          </div>
        ))}
      </div>
    </div>
  );
}
