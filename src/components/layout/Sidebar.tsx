import { useState } from 'react';
import { usePaletteStore } from '../../store/paletteStore';
import { useGeneratedRamp } from '../../hooks/useGeneratedRamp';
import type { ColorScale } from '../../types/palette';

function ScaleItem({
  scale,
  isActive,
  onClick,
}: {
  scale: ColorScale;
  isActive: boolean;
  onClick: () => void;
}) {
  const ramp = useGeneratedRamp(scale);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        borderRadius: 6,
        background: isActive ? 'var(--p-bg-inset)' : 'transparent',
        border: isActive ? '1px solid var(--p-border)' : '1px solid transparent',
        cursor: 'pointer',
      }}
    >
      <p
        style={{
          fontSize: 12,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? 'var(--p-text)' : 'var(--p-text-secondary)',
          marginBottom: 5,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {scale.name}
      </p>
      {/* Mini ramp strip */}
      <div
        style={{
          display: 'flex',
          height: 16,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {ramp.steps.map((step) => (
          <div
            key={step.name}
            style={{ flex: 1, backgroundColor: step.hex }}
          />
        ))}
      </div>
    </button>
  );
}

export function Sidebar() {
  const scales = usePaletteStore((s) => s.scales);
  const activeScaleId = usePaletteStore((s) => s.activeScaleId);
  const setActiveScale = usePaletteStore((s) => s.setActiveScale);
  const addScale = usePaletteStore((s) => s.addScale);
  const [newHex, setNewHex] = useState('#6366f1');

  const effectiveActiveId = activeScaleId ?? scales[0]?.id;

  return (
    <aside
      style={{
        width: 192,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--p-bg-subtle)',
        borderRight: '1px solid var(--p-border)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--p-border)',
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--p-text-secondary)',
        }}
      >
        Scales
      </div>

      {/* Scale list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {scales.map((scale) => (
            <ScaleItem
              key={scale.id}
              scale={scale}
              isActive={effectiveActiveId === scale.id}
              onClick={() => setActiveScale(scale.id)}
            />
          ))}
        </div>
      </div>

      {/* Add new scale */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--p-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <input
            type="color"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            style={{
              width: 28,
              height: 28,
              padding: 0,
              border: '1px solid var(--p-border)',
              borderRadius: 4,
              cursor: 'pointer',
              background: 'none',
              flexShrink: 0,
            }}
          />
          <input
            type="text"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 11,
              fontFamily: 'monospace',
              background: 'var(--p-bg)',
              border: '1px solid var(--p-border)',
              borderRadius: 4,
              color: 'var(--p-text)',
              outline: 'none',
            }}
            placeholder="#6366f1"
          />
        </div>
        <button
          onClick={() => { addScale(newHex); setNewHex('#6366f1'); }}
          style={{
            width: '100%',
            padding: '6px 0',
            fontSize: 12,
            fontWeight: 500,
            background: 'var(--p-bg)',
            border: '1px solid var(--p-border)',
            borderRadius: 6,
            color: 'var(--p-text)',
            cursor: 'pointer',
          }}
        >
          New scale
        </button>
      </div>
    </aside>
  );
}
