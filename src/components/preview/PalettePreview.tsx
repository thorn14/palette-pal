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
  const gridColumns = `minmax(120px, 120px) repeat(${colCount}, minmax(0, 1fr))`;

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          height: 28,
          borderBottom: '1px solid var(--p-border)',
          background: 'var(--p-bg-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingInline: 12,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'monospace',
            color: 'var(--p-text-secondary)',
          }}
        >
          Name
        </div>
        <HeaderRow scale={firstScale} />
      </div>

      {/* Rows */}
      <div>
        {scales.map((scale) => (
          <div
            key={scale.id}
            style={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              borderBottom: '1px solid var(--p-border)',
            }}
          >
            <div
              style={{
                height: 48,
                display: 'flex',
                alignItems: 'center',
                paddingInline: 12,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'monospace',
                color: 'var(--p-text)',
                borderRight: '1px solid var(--p-border)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {scale.name}
            </div>
            <PreviewRow scale={scale} colCount={colCount} />
          </div>
        ))}
      </div>
    </div>
  );
}
