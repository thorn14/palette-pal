import { usePaletteStore, selectActiveScale } from '../../store/paletteStore';
import { LIGHTNESS_PRESET_OPTIONS, type LightnessPreset } from '../../constants/stepPresets';
import type { StepNamingPreset } from '../../types/palette';

type AppMode = 'edit' | 'preview';
type AppTheme = 'light' | 'dark';

interface Props {
  onExport: () => void;
  onSave: () => void;
  onEditSteps: () => void;
  onEditLightness: () => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const divider = (
  <div style={{ width: 1, height: 20, background: 'var(--p-border)', flexShrink: 0 }} />
);

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--p-text-tertiary)',
  whiteSpace: 'nowrap',
};

const compactSelectStyle: React.CSSProperties = {
  padding: '3px 6px',
  fontSize: 12,
  background: 'var(--p-bg)',
  border: '1px solid var(--p-border)',
  borderRadius: 5,
  color: 'var(--p-text)',
  cursor: 'pointer',
  outline: 'none',
};

const compactBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  fontSize: 12,
  fontWeight: 500,
  background: 'var(--p-bg)',
  border: '1px solid var(--p-border)',
  borderRadius: 5,
  color: 'var(--p-text)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function TopBar({ onExport, onSave, onEditSteps, onEditLightness, mode, onModeChange, theme, onThemeChange, saveStatus }: Props) {
  const updateStepNamingAll = usePaletteStore((s) => s.updateStepNamingAll);
  const applyLightnessPreset = usePaletteStore((s) => s.applyLightnessPreset);
  const scale = usePaletteStore(selectActiveScale);

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'saved' ? 'Saved' :
    saveStatus === 'error' ? 'Save failed' :
    'Save';

  return (
    <header
      style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        background: 'var(--p-bg)',
        borderBottom: '1px solid var(--p-border)',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="9" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
          <circle cx="7"  cy="7"  r="2.2" fill="#0969da" />
          <circle cx="13" cy="7"  r="2.2" fill="#bf3989" />
          <circle cx="7"  cy="13" r="2.2" fill="#1a7f37" />
          <circle cx="13" cy="13" r="2.2" fill="#9a6700" />
        </svg>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--p-text)' }}>palette-pal</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '1px 7px',
            borderRadius: 99,
            border: '1px solid var(--p-border)',
            color: 'var(--p-text-secondary)',
          }}
        >
          Experimental
        </span>
      </div>

      {divider}

      {/* Steps — applies to all scales */}
      {scale && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={labelStyle}>Steps</span>
          <select
            value={scale.naming.preset}
            onChange={(e) => updateStepNamingAll({ preset: e.target.value as StepNamingPreset })}
            style={compactSelectStyle}
          >
            <option value="tailwind">Tailwind</option>
            <option value="numeric">Numeric</option>
            <option value="custom">Custom</option>
          </select>
          <button onClick={onEditSteps} style={compactBtnStyle}>Edit</button>
        </div>
      )}

      {divider}

      {/* Lightness — applies to active scale */}
      {scale && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={labelStyle}>Lightness</span>
          <select
            value={scale.lightnessPreset}
            onChange={(e) => applyLightnessPreset(scale.id, e.target.value as LightnessPreset)}
            style={compactSelectStyle}
          >
            {LIGHTNESS_PRESET_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button onClick={onEditLightness} style={compactBtnStyle}>Edit</button>
        </div>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Edit / Preview toggle */}
      <div
        style={{
          display: 'flex',
          border: '1px solid var(--p-border)',
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {(['edit', 'preview'] as const).map((m, i) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            style={{
              padding: '4px 14px',
              fontSize: 12,
              fontWeight: 500,
              background: mode === m ? 'var(--p-bg-inset)' : 'var(--p-bg)',
              color: mode === m ? 'var(--p-text)' : 'var(--p-text-secondary)',
              border: 'none',
              borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Right: Save + theme + Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          style={{
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 500,
            background: 'var(--p-bg)',
            border: '1px solid var(--p-border)',
            borderRadius: 6,
            color: saveStatus === 'error' ? 'var(--p-danger)' : 'var(--p-text)',
            cursor: saveStatus === 'saving' ? 'default' : 'pointer',
          }}
        >
          {saveLabel}
        </button>
        <button
          onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          style={{
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--p-bg)',
            border: '1px solid var(--p-border)',
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--p-text-secondary)',
            fontSize: 14,
          }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button
          onClick={onExport}
          style={{
            padding: '4px 14px',
            fontSize: 12,
            fontWeight: 500,
            background: 'var(--p-bg)',
            border: '1px solid var(--p-border)',
            borderRadius: 6,
            color: 'var(--p-text)',
            cursor: 'pointer',
          }}
        >
          Export
        </button>
      </div>
    </header>
  );
}
