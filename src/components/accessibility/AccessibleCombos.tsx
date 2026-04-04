import { useMemo, useState } from 'react';
import { usePaletteStore } from '../../store/paletteStore';
import { generateRamp } from '../../lib/colorMath';
import { buildContrastMap } from '../../lib/exportContrastMap';
import type { WcagMapEntry, ApcaMapEntry } from '../../types/palette';

const WCAG_SECTIONS = [
  { key: 'aaa' as const, label: 'AAA — High Contrast', sub: '≥ 7:1' },
  { key: 'aa' as const, label: 'AA — Text', sub: '4.5:1 – 6.99:1' },
  { key: 'aa-large' as const, label: 'AA Large — Decorative / Image', sub: '3:1 – 4.49:1' },
];

const APCA_SECTIONS = [
  { key: 'lc75' as const, label: 'Lc 75+ — High Contrast', sub: '|Lc| ≥ 75' },
  { key: 'lc60' as const, label: 'Lc 60+ — Body Text', sub: '|Lc| 60 – 74' },
  { key: 'lc45' as const, label: 'Lc 45+ — Large Text / Decorative', sub: '|Lc| 45 – 59' },
];

function WcagComboCard({ entry }: { entry: WcagMapEntry }) {
  return (
    <div
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid var(--p-border)',
        minWidth: 140,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: entry.bg.hex,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span style={{ color: entry.fg.hex, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>Aa</span>
        <span style={{ color: entry.fg.hex, fontSize: 10, opacity: 0.85 }}>
          {entry.fg.ramp} {entry.fg.step}
        </span>
        <span style={{ color: entry.fg.hex, fontSize: 10, opacity: 0.6 }}>
          on {entry.bg.ramp} {entry.bg.step}
        </span>
      </div>
      <div
        style={{
          padding: '5px 8px',
          background: 'var(--p-bg-subtle)',
          fontSize: 10,
          color: 'var(--p-text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>{entry.ratio}:1</span>
        <span style={{ fontFamily: 'monospace', fontSize: 9, opacity: 0.7 }}>{entry.fg.hex}</span>
      </div>
    </div>
  );
}

function ApcaComboCard({ entry }: { entry: ApcaMapEntry }) {
  return (
    <div
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid var(--p-border)',
        minWidth: 140,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: entry.bg.hex,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <span style={{ color: entry.fg.hex, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>Aa</span>
        <span style={{ color: entry.fg.hex, fontSize: 10, opacity: 0.85 }}>
          {entry.fg.ramp} {entry.fg.step}
        </span>
        <span style={{ color: entry.fg.hex, fontSize: 10, opacity: 0.6 }}>
          on {entry.bg.ramp} {entry.bg.step}
        </span>
      </div>
      <div
        style={{
          padding: '5px 8px',
          background: 'var(--p-bg-subtle)',
          fontSize: 10,
          color: 'var(--p-text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Lc {entry.lc.toFixed(1)}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 9, opacity: 0.7 }}>{entry.fg.hex}</span>
      </div>
    </div>
  );
}

function Section({ title, sub, count, children }: { title: string; sub: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 24 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 0 8px 0',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text)' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--p-text-tertiary)' }}>{sub}</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: 'var(--p-text-secondary)',
            background: 'var(--p-bg-subtle)',
            border: '1px solid var(--p-border)',
            borderRadius: 10,
            padding: '1px 7px',
          }}
        >
          {count}
        </span>
        <span style={{ fontSize: 10, color: 'var(--p-text-tertiary)', marginLeft: 4 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {count === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--p-text-tertiary)', padding: '4px 0' }}>
              No pairs in this range
            </span>
          ) : children}
        </div>
      )}
    </div>
  );
}

export function AccessibleCombos() {
  const scales = usePaletteStore((s) => s.scales);
  const contrastMode = usePaletteStore((s) => s.contrastMode);
  const ramps = useMemo(() => scales.map((s) => generateRamp(s)), [scales]);
  const map = useMemo(() => buildContrastMap(ramps), [ramps]);

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px 24px',
        background: 'var(--p-bg)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-text)', margin: '0 0 4px 0' }}>
            Accessible Combinations — {contrastMode === 'wcag' ? 'WCAG 2.1' : 'APCA'}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--p-text-secondary)', margin: 0 }}>
            {map.totalSteps} color steps across {map.totalRamps} ramps. Toggle WCAG / APCA in the toolbar to switch standards.
          </p>
        </div>

        {contrastMode === 'wcag' ? (
          WCAG_SECTIONS.map(({ key, label, sub }) => (
            <Section key={key} title={label} sub={sub} count={map.wcag[key].length}>
              {map.wcag[key].map((entry, i) => (
                <WcagComboCard key={i} entry={entry} />
              ))}
            </Section>
          ))
        ) : (
          APCA_SECTIONS.map(({ key, label, sub }) => (
            <Section key={key} title={label} sub={sub} count={map.apca[key].length}>
              {map.apca[key].map((entry, i) => (
                <ApcaComboCard key={i} entry={entry} />
              ))}
            </Section>
          ))
        )}
      </div>
    </div>
  );
}
