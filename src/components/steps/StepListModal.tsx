import { useMemo, useState } from 'react';
import type { ColorScale } from '../../types/palette';
import { resolveStepNames } from '../../constants/stepPresets';
import { usePaletteStore } from '../../store/paletteStore';

interface Props {
  scale: ColorScale;
  onClose: () => void;
}

function parseNameList(text: string): string[] {
  return text
    .split(/[\n,]+/g)
    .map((n) => n.trim())
    .filter(Boolean);
}

function parseLightnessList(text: string): number[] {
  return text
    .split(/[\s,]+/g)
    .map((n) => n.trim())
    .filter(Boolean)
    .map((n) => {
      const v = parseFloat(n);
      if (Number.isNaN(v)) return null;
      const normalized = v > 1 ? v / 100 : v;
      return Math.max(0, Math.min(1, normalized));
    })
    .filter((v): v is number => v !== null);
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 10000) / 10000;
  const str = rounded.toString();
  return str;
}

function parseMaybeNumber(value?: string): number | null {
  if (!value) return null;
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : null;
}

function autoInsertName(names: string[], index: number): string {
  const prev = names[index - 1];
  const next = names[index];
  const prevNum = parseMaybeNumber(prev);
  const nextNum = parseMaybeNumber(next);
  if (prevNum !== null && nextNum !== null) {
    return formatNumber((prevNum + nextNum) / 2);
  }
  if (prevNum === null && nextNum !== null) {
    const nextNextNum = parseMaybeNumber(names[index + 1]);
    if (nextNextNum !== null) {
      return formatNumber(nextNum - (nextNextNum - nextNum));
    }
  }
  if (prevNum !== null && nextNum === null) {
    const prevPrevNum = parseMaybeNumber(names[index - 2]);
    if (prevPrevNum !== null) {
      return formatNumber(prevNum + (prevNum - prevPrevNum));
    }
  }
  return `New ${index + 1}`;
}

export function StepListModal({ scale, onClose }: Props) {
  const updateStepName = usePaletteStore((s) => s.updateStepName);
  const updateLightnessAt = usePaletteStore((s) => s.updateLightnessAt);
  const insertStepAt = usePaletteStore((s) => s.insertStepAt);
  const removeStepAt = usePaletteStore((s) => s.removeStepAt);
  const setStepsAndLightness = usePaletteStore((s) => s.setStepsAndLightness);

  const names = useMemo(
    () => resolveStepNames(scale.naming.preset, scale.stepCount, scale.naming.customNames),
    [scale.naming.preset, scale.naming.customNames, scale.stepCount]
  );

  const lightness = scale.curves.lightness.values;

  const [bulkNames, setBulkNames] = useState('');
  const [bulkLightness, setBulkLightness] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleInsert(index: number) {
    const name = autoInsertName(names, index);
    insertStepAt(scale.id, index, name);
  }

  function handleBulkApply() {
    const parsedNames = bulkNames.trim() ? parseNameList(bulkNames) : null;
    const parsedLightness = bulkLightness.trim() ? parseLightnessList(bulkLightness) : null;

    if (!parsedNames && !parsedLightness) {
      setError('Paste a step list, a lightness list, or both.');
      return;
    }

    if (parsedNames && parsedNames.length === 0) {
      setError('Step list is empty.');
      return;
    }

    if (parsedLightness && parsedLightness.length === 0) {
      setError('Lightness list is empty.');
      return;
    }

    if (parsedNames && parsedLightness && parsedNames.length !== parsedLightness.length) {
      setError('Step list and lightness list must be the same length.');
      return;
    }

    if (!parsedNames && parsedLightness && parsedLightness.length !== scale.stepCount) {
      setError('Lightness list length must match current step count.');
      return;
    }

    setStepsAndLightness(scale.id, parsedNames, parsedLightness);
    setError(null);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--p-bg)',
          border: '1px solid var(--p-border)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 860,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          boxShadow: '0 10px 32px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--p-border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--p-text)' }}>
              Steps & Lightness
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--p-text-secondary)' }}>
              Edit step names and L values (0–1). Paste bulk lists below.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--p-border)',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 16,
              color: 'var(--p-text-secondary)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: 16, padding: 20, overflow: 'auto' }}>
          <div style={{ flex: 1, minWidth: 340 }}>
            <div
              style={{
                border: '1px solid var(--p-border)',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 1fr 120px 140px',
                  gap: 0,
                  background: 'var(--p-bg-subtle)',
                  borderBottom: '1px solid var(--p-border)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--p-text-secondary)',
                  padding: '8px 10px',
                }}
              >
                <div>#</div>
                <div>Name</div>
                <div>L (0–1)</div>
                <div>Actions</div>
              </div>

              <div style={{ maxHeight: 360, overflow: 'auto' }}>
                {names.map((name, index) => (
                  <div
                    key={`${name}-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 1fr 120px 140px',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--p-border-muted)',
                    }}
                  >
                    <div style={{ fontSize: 12, color: 'var(--p-text-tertiary)' }}>
                      {index + 1}
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => updateStepName(scale.id, index, e.target.value)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--p-border)',
                        background: 'var(--p-bg)',
                        fontSize: 13,
                        color: 'var(--p-text)',
                      }}
                    />
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.0001}
                      value={lightness[index] != null ? lightness[index].toFixed(4) : '0.5000'}
                      onChange={(e) => updateLightnessAt(scale.id, index, parseFloat(e.target.value) || 0)}
                      style={{
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--p-border)',
                        background: 'var(--p-bg)',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: 'var(--p-text)',
                        textAlign: 'right',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleInsert(index)}
                        style={{
                          padding: '4px 6px',
                          fontSize: 11,
                          background: 'var(--p-bg)',
                          border: '1px solid var(--p-border)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: 'var(--p-text-secondary)',
                        }}
                      >
                        + before
                      </button>
                      <button
                        onClick={() => handleInsert(index + 1)}
                        style={{
                          padding: '4px 6px',
                          fontSize: 11,
                          background: 'var(--p-bg)',
                          border: '1px solid var(--p-border)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: 'var(--p-text-secondary)',
                        }}
                      >
                        + after
                      </button>
                      <button
                        onClick={() => removeStepAt(scale.id, index)}
                        style={{
                          padding: '4px 6px',
                          fontSize: 11,
                          background: 'var(--p-danger-subtle)',
                          border: '1px solid var(--p-border)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          color: 'var(--p-danger)',
                        }}
                      >
                        remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ padding: 10, display: 'flex', justifyContent: 'space-between' }}>
                <button
                  onClick={() => handleInsert(names.length)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 12,
                    background: 'var(--p-bg)',
                    border: '1px solid var(--p-border)',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: 'var(--p-text)',
                  }}
                >
                  Add step at end
                </button>
                <span style={{ fontSize: 12, color: 'var(--p-text-secondary)' }}>
                  {names.length} steps
                </span>
              </div>
            </div>
          </div>

          <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--p-text-secondary)' }}>
                Step list (names only)
              </label>
              <textarea
                value={bulkNames}
                onChange={(e) => setBulkNames(e.target.value)}
                placeholder="50, 100, 200, 300"
                style={{
                  width: '100%',
                  height: 120,
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--p-border)',
                  background: 'var(--p-bg-subtle)',
                  color: 'var(--p-text)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--p-text-secondary)' }}>
                Lightness list (0–1 or 0–100)
              </label>
              <textarea
                value={bulkLightness}
                onChange={(e) => setBulkLightness(e.target.value)}
                placeholder="0.98, 0.94, 0.86, 0.76"
                style={{
                  width: '100%',
                  height: 120,
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid var(--p-border)',
                  background: 'var(--p-bg-subtle)',
                  color: 'var(--p-text)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  resize: 'vertical',
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: 'var(--p-danger)' }}>
                {error}
              </div>
            )}

            <button
              onClick={handleBulkApply}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                background: 'var(--p-accent)',
                border: '1px solid var(--p-accent)',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Apply Bulk Lists
            </button>

            <p style={{ fontSize: 11, color: 'var(--p-text-tertiary)', lineHeight: 1.4 }}>
              Lightness values accept 0–1 or 0–100. Display is normalized to 0–1.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 20px',
            borderTop: '1px solid var(--p-border)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              background: 'transparent',
              border: '1px solid var(--p-border)',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--p-text-secondary)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
