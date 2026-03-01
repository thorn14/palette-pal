import { useState, useEffect, useRef } from 'react';
import type { ColorScale, GeneratedStep } from '../../types/palette';
import { usePaletteStore } from '../../store/paletteStore';
import { getContrast, sourceWithChromaToHex, autoHueShiftBase, maxP3Chroma, maxSrgbChroma } from '../../lib/colorMath';
import { useGeneratedRamp } from '../../hooks/useGeneratedRamp';

interface Props {
  scale: ColorScale;
  activeStep: GeneratedStep | null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--p-text-secondary)', marginBottom: 8 }}>
      {children}
    </p>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--p-text-secondary)', marginBottom: 4 }}>
      {children}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 8px',
  fontSize: 13,
  background: 'var(--p-bg)',
  border: '1px solid var(--p-border)',
  borderRadius: 6,
  color: 'var(--p-text)',
  outline: 'none',
};

const sectionStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--p-border)',
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function RightPanel({ scale, activeStep }: Props) {
  const updateSourceHex = usePaletteStore((s) => s.updateSourceHex);
  const updateScaleName = usePaletteStore((s) => s.updateScaleName);
  const updateHueShift = usePaletteStore((s) => s.updateHueShift);
  const updateChromaPeak = usePaletteStore((s) => s.updateChromaPeak);
  const setChromaCurveValues = usePaletteStore((s) => s.setChromaCurveValues);
  const removeScale = usePaletteStore((s) => s.removeScale);
  const ramp = useGeneratedRamp(scale);

  const [confirmDelete, setConfirmDelete] = useState(false);

  // --- Hex input draft ---
  const [hexDraft, setHexDraft] = useState(scale.sourceHex);
  const hexFocused = useRef(false);
  useEffect(() => {
    if (!hexFocused.current) setHexDraft(scale.sourceHex);
  }, [scale.sourceHex]);

  function commitHex() {
    hexFocused.current = false;
    if (HEX_RE.test(hexDraft)) updateSourceHex(scale.id, hexDraft);
    else setHexDraft(scale.sourceHex);
  }

  // --- Chroma draft (number next to slider) ---
  const [chromaDraft, setChromaDraft] = useState(scale.chromaPeak.toFixed(3));
  const chromaFocused = useRef(false);
  useEffect(() => {
    if (!chromaFocused.current) setChromaDraft(scale.chromaPeak.toFixed(3));
  }, [scale.chromaPeak]);

  function commitChroma() {
    chromaFocused.current = false;
    const v = parseFloat(chromaDraft);
    if (isFinite(v)) updateChromaPeak(scale.id, v);
    else setChromaDraft(scale.chromaPeak.toFixed(3));
  }

  return (
    <aside
      className="shrink-0 overflow-y-auto"
      style={{ width: 260, background: 'var(--p-bg-subtle)', borderLeft: '1px solid var(--p-border)' }}
    >
      {/* Scale name + source color */}
      <div style={sectionStyle}>
        <SectionLabel>Scale</SectionLabel>

        <FieldLabel>Name</FieldLabel>
        <input
          type="text"
          value={scale.name}
          onChange={(e) => updateScaleName(scale.id, e.target.value)}
          style={inputStyle}
        />

        <div style={{ marginTop: 12 }}>
          <FieldLabel>Source color</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              type="color"
              value={sourceWithChromaToHex(scale.sourceOklch.l, scale.chromaPeak, scale.sourceOklch.h)}
              onChange={(e) => updateSourceHex(scale.id, e.target.value)}
              style={{
                width: 32,
                height: 32,
                padding: 0,
                border: '1px solid var(--p-border)',
                borderRadius: 4,
                cursor: 'pointer',
                background: 'none',
              }}
            />
            <input
              type="text"
              value={hexDraft}
              onFocus={() => { hexFocused.current = true; }}
              onChange={(e) => setHexDraft(e.target.value)}
              onBlur={commitHex}
              onKeyDown={(e) => { if (e.key === 'Enter') commitHex(); }}
              style={{ ...inputStyle, width: 'auto', flex: 1, fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--p-text-secondary)', lineHeight: 1.8 }}>
            <div>L {scale.sourceOklch.l.toFixed(4)}</div>
            <div>C {scale.sourceOklch.c.toFixed(4)}</div>
            <div>H {scale.sourceOklch.h.toFixed(2)}°</div>
          </div>
        </div>
      </div>

      {/* Chroma */}
      <div style={sectionStyle}>
        <SectionLabel>Chroma</SectionLabel>
        <FieldLabel>Peak chroma (0 – 0.4)</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.001}
            value={scale.chromaPeak}
            onChange={(e) => updateChromaPeak(scale.id, parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--p-accent)' }}
          />
          <input
            type="number"
            min={0}
            max={0.4}
            step={0.001}
            value={chromaDraft}
            onFocus={() => { chromaFocused.current = true; }}
            onChange={(e) => setChromaDraft(e.target.value)}
            onBlur={commitChroma}
            onKeyDown={(e) => { if (e.key === 'Enter') commitChroma(); }}
            style={{
              ...inputStyle,
              width: 64,
              textAlign: 'right',
              fontFamily: 'monospace',
              fontSize: 12,
              padding: '4px 6px',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={() => {
              const values = ramp.steps.map((step) => maxSrgbChroma(step.oklch.l, step.oklch.h));
              setChromaCurveValues(scale.id, values);
            }}
            style={{
              flex: 1,
              padding: '5px 8px',
              fontSize: 12,
              background: 'var(--p-bg)',
              border: '1px solid var(--p-border)',
              borderRadius: 6,
              color: 'var(--p-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Pin to sRGB
          </button>
          <button
            onClick={() => {
              const values = ramp.steps.map((step) => maxP3Chroma(step.oklch.l, step.oklch.h));
              setChromaCurveValues(scale.id, values);
            }}
            style={{
              flex: 1,
              padding: '5px 8px',
              fontSize: 12,
              background: 'var(--p-bg)',
              border: '1px solid var(--p-border)',
              borderRadius: 6,
              color: 'var(--p-text-secondary)',
              cursor: 'pointer',
            }}
          >
            Pin to P3
          </button>
        </div>
      </div>

      {/* Hue shift */}
      <div style={sectionStyle}>
        <SectionLabel>Hue shift</SectionLabel>
        <p style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginBottom: 10, lineHeight: 1.4 }}>
          Scales with proximity to nearest RGB primary — closer hues shift less.
        </p>
        {(
          [
            { key: 'lightEndAdjust' as const, label: 'Light end', dotColor: 'var(--p-text-secondary)' },
            { key: 'darkEndAdjust'  as const, label: 'Dark end',  dotColor: 'var(--p-text-tertiary)' },
          ] as const
        ).map(({ key, label, dotColor }) => {
          const adjust = scale.hueShift[key];
          const autoBase = Math.round(autoHueShiftBase(scale.sourceOklch.h));
          const effectiveDeg = Math.round(autoBase + adjust);
          return (
            <div key={key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <label style={{ fontSize: 12, color: 'var(--p-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, display: 'inline-block' }} />
                  {label}
                </label>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--p-text-tertiary)' }}>
                  auto {autoBase}° → {effectiveDeg}°
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="number"
                  min={-90}
                  max={90}
                  value={adjust}
                  onChange={(e) => {
                    const v = Math.max(-90, Math.min(90, parseInt(e.target.value) || 0));
                    updateHueShift(scale.id, key, v);
                  }}
                  style={{
                    ...inputStyle,
                    width: 64,
                    textAlign: 'right',
                    fontFamily: 'monospace',
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--p-text-tertiary)' }}>°</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active step detail */}
      {activeStep && (
        <div style={sectionStyle}>
          <SectionLabel>{activeStep.name}</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 4,
                backgroundColor: activeStep.hex,
                border: '1px solid var(--p-border)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--p-text)' }}>
              {activeStep.hex}
            </span>
          </div>
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--p-text-secondary)', lineHeight: 1.8, marginBottom: 8 }}>
            <div>L {activeStep.oklch.l.toFixed(4)}</div>
            <div>C {activeStep.oklch.c.toFixed(4)}</div>
            <div>H {activeStep.oklch.h.toFixed(2)}°</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--p-text-secondary)' }}>
            {[['#ffffff', 'on white'] as const, ['#000000', 'on black'] as const].map(([bg, label]) => {
              const c = getContrast(activeStep.hex, bg);
              return (
                <div key={bg} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>{label}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--p-text)' }}>
                    {c.ratio.toFixed(2)}
                    <span style={{ marginLeft: 6, fontSize: 10, color: c.level === 'fail' ? 'var(--p-danger)' : 'var(--p-success)', fontWeight: 600 }}>
                      {c.level === 'fail' ? 'Fail' : c.level}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete scale — last section */}
      <div style={{ ...sectionStyle, borderBottom: 'none' }}>
        <SectionLabel>Danger zone</SectionLabel>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              width: '100%',
              padding: '5px 8px',
              fontSize: 12,
              background: 'var(--p-bg)',
              border: '1px solid var(--p-border)',
              borderRadius: 6,
              color: 'var(--p-danger)',
              cursor: 'pointer',
            }}
          >
            Delete scale
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 12, color: 'var(--p-text)', marginBottom: 8, lineHeight: 1.4 }}>
              Delete <strong>{scale.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => removeScale(scale.id)}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--p-danger)',
                  border: '1px solid var(--p-danger)',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  fontSize: 12,
                  background: 'var(--p-bg)',
                  border: '1px solid var(--p-border)',
                  borderRadius: 6,
                  color: 'var(--p-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
