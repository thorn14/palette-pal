import { useState, useEffect, useRef } from 'react';
import { usePaletteStore, selectActiveScale } from '../../store/paletteStore';
import { LIGHTNESS_PRESET_OPTIONS, type LightnessPreset } from '../../constants/stepPresets';
import type { StepNamingPreset } from '../../types/palette';

type AppMode = 'edit' | 'preview' | 'visualize' | 'combos';
type AppTheme = 'light' | 'dark';

interface Props {
  onExport: () => void;
  onImport: () => void;
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
  minWidth: 110,
};

const linkBtnStyle: React.CSSProperties = {
  padding: 0,
  fontSize: 12,
  background: 'none',
  border: 'none',
  color: 'var(--p-text-secondary)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};


export function TopBar({ onExport, onImport, onSave, onEditSteps, onEditLightness, mode, onModeChange, theme, onThemeChange, saveStatus }: Props) {
  const updateStepNamingAll = usePaletteStore((s) => s.updateStepNamingAll);
  const applyLightnessPreset = usePaletteStore((s) => s.applyLightnessPreset);
  const scale = usePaletteStore(selectActiveScale);
  const contrastMode = usePaletteStore((s) => s.contrastMode);
  const setContrastMode = usePaletteStore((s) => s.setContrastMode);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const saveLabel =
    saveStatus === 'saving' ? 'Saving…' :
    saveStatus === 'saved' ? 'Saved' :
    saveStatus === 'error' ? 'Save failed' :
    'Save';

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

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
        overflow: 'visible',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="9" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
          <circle cx="7" cy="7" r="2.2" fill="var(--p-text-secondary)" />
          <circle cx="13" cy="7" r="2.2" fill="var(--p-text-tertiary)" />
          <circle cx="7" cy="13" r="2.2" fill="var(--p-text)" />
          <circle cx="13" cy="13" r="2.2" fill="var(--p-border)" />
        </svg>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--p-text)' }}>palette-pal</span>
      </div>

      {divider}

      {/* Steps — applies to all scales */}
      {scale && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={labelStyle}>Steps</span>
          <select
            id="steps-preset"
            name="steps-preset"
            value={scale.naming.preset}
            onChange={(e) => {
              const v = e.target.value as StepNamingPreset;
              updateStepNamingAll({ preset: v });
              if (v === 'custom') onEditSteps();
            }}
            style={compactSelectStyle}
          >
            <option value="tailwind">Tailwind</option>
            <option value="numeric">Numeric</option>
            <option value="custom">Custom…</option>
          </select>
          {scale.naming.preset === 'custom' && (
            <button onClick={onEditSteps} style={linkBtnStyle}>edit</button>
          )}
        </div>
      )}

      {divider}

      {/* Lightness — applies to active scale */}
      {scale && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={labelStyle}>Lightness</span>
          <select
            id="lightness-preset"
            name="lightness-preset"
            value={scale.lightnessPreset}
            onChange={(e) => {
              const v = e.target.value as LightnessPreset;
              if (v === 'custom') {
                applyLightnessPreset(scale.id, 'custom');
                onEditLightness();
              } else {
                applyLightnessPreset(scale.id, v);
              }
            }}
            style={compactSelectStyle}
          >
            {LIGHTNESS_PRESET_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {scale.lightnessPreset === 'custom' && (
            <button onClick={onEditLightness} style={linkBtnStyle}>edit</button>
          )}
        </div>
      )}

      {/* WCAG / APCA toggle */}
      <div
        style={{
          display: 'flex',
          border: '1px solid var(--p-border)',
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {(['wcag', 'apca'] as const).map((m, i) => (
          <button
            key={m}
            onClick={() => setContrastMode(m)}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: contrastMode === m ? 'var(--p-bg-inset)' : 'var(--p-bg)',
              color: contrastMode === m ? 'var(--p-text)' : 'var(--p-text-secondary)',
              border: 'none',
              borderLeft: i > 0 ? '1px solid var(--p-border)' : 'none',
              cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Edit / Preview / Visualize / Combos toggle */}
      <div
        style={{
          display: 'flex',
          border: '1px solid var(--p-border)',
          borderRadius: 6,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {(['edit', 'preview', 'visualize', 'combos'] as const).map((m, i) => (
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
        {theme === 'light' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M20 15.36A9 9 0 0 1 8.64 4 9 9 0 1 0 20 15.36Z" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
            <path d="M12 3v2.25M12 18.75V21M3 12h2.25M18.75 12H21M5.64 5.64l1.6 1.6M16.76 16.76l1.6 1.6M18.36 5.64l-1.6 1.6M7.24 16.76l-1.6 1.6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Right: Save + theme + Export */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div
          ref={menuRef}
          style={{
            display: 'inline-flex',
            position: 'relative',
            border: '1px solid var(--p-border)',
            borderRadius: 6,
            overflow: 'visible',
            background: 'var(--p-bg)',
            fontSize: 12,
          }}
        >
          <button
            onClick={onSave}
            disabled={saveStatus === 'saving'}
            style={{
              padding: '4px 14px',
              fontWeight: 500,
              background: 'var(--p-bg)',
              border: 'none',
              color:
                saveStatus === 'error'
                  ? 'var(--p-danger)'
                  : saveStatus === 'saved'
                    ? 'var(--p-success)'
                    : 'var(--p-text)',
              cursor: saveStatus === 'saving' ? 'default' : 'pointer',
            }}
          >
            {saveLabel}
          </button>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="More save/export options"
            style={{
              padding: '4px 10px',
              borderLeft: '1px solid var(--p-border)',
              background: 'var(--p-bg)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M2 3h6L5 7z" fill="var(--p-text)" />
            </svg>
          </button>
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                background: 'var(--p-bg)',
                border: '1px solid var(--p-border)',
                borderRadius: 6,
                padding: '4px 0',
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                zIndex: 5,
                minWidth: 140,
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSave();
                }}
                disabled={saveStatus === 'saving'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: saveStatus === 'saving' ? 'default' : 'pointer',
                }}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onImport();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Import
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onExport();
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Export
              </button>
          </div>
        )}
      </div>
    </div>
  </header>
);
}
