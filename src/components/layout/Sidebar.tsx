import { useState } from 'react';
import { usePaletteStore } from '../../store/paletteStore';
import { useGeneratedRamp } from '../../hooks/useGeneratedRamp';
import type { ColorScale } from '../../types/palette';

function LockIcon({ locked }: { locked?: boolean }) {
  return locked ? (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" aria-hidden="true" style={{ display: 'block' }}>
      {/* Closed lock */}
      <rect x="1.5" y="5.5" width="8" height="6.5" rx="1.5" />
      <path d="M3 5.5V3.5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="5.5" cy="8.75" r="1" fill="var(--p-bg-subtle)" />
    </svg>
  ) : (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" aria-hidden="true" style={{ display: 'block' }}>
      {/* Open lock */}
      <rect x="1.5" y="5.5" width="8" height="6.5" rx="1.5" />
      <path d="M3 5.5V3.5a2.5 2.5 0 0 1 5 0" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const supportsP3 = typeof CSS !== 'undefined' && CSS.supports('color', 'color(display-p3 0 0 0)');

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" style={{ display: 'block' }} aria-hidden="true">
      <circle cx="3" cy="2.5" r="1.2" />
      <circle cx="7" cy="2.5" r="1.2" />
      <circle cx="3" cy="7" r="1.2" />
      <circle cx="7" cy="7" r="1.2" />
      <circle cx="3" cy="11.5" r="1.2" />
      <circle cx="7" cy="11.5" r="1.2" />
    </svg>
  );
}

function ScaleItem({
  scale,
  isActive,
  isDragging,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  onToggleLock,
}: {
  scale: ColorScale;
  isActive: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleLock: () => void;
}) {
  const ramp = useGeneratedRamp(scale);
  const srgbPreview = usePaletteStore((s) => s.srgbPreview);

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.altKey && e.key === 'ArrowUp') {
          e.preventDefault();
          onMoveUp();
        }
        if (e.altKey && e.key === 'ArrowDown') {
          e.preventDefault();
          onMoveDown();
        }
      }}
      aria-pressed={isActive}
      aria-label={`${scale.name}. Press Enter to select. Press Option and Arrow keys to reorder.`}
      className="focus-visible-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 8px 8px 4px',
        borderRadius: 6,
        background: isActive ? 'var(--p-bg-inset)' : 'transparent',
        border: `1px solid ${isActive ? 'var(--p-border)' : 'transparent'}`,
        opacity: isDragging ? 0.35 : 1,
        cursor: 'grab',
        transition: 'opacity 0.1s',
        userSelect: 'none',
        width: '100%',
        textAlign: 'left',
      }}
    >
      {/* Grip handle */}
      <div style={{ color: 'var(--p-text-tertiary)', flexShrink: 0, padding: '0 2px', lineHeight: 0 }}>
        <GripIcon />
      </div>

      {/* Name + mini ramp */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? 'var(--p-text)' : 'var(--p-text-secondary)',
            marginBottom: 5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
          }}
        >
          {scale.name}
        </span>
        <div style={{ display: 'flex', height: 16, borderRadius: 3, overflow: 'hidden' }}>
          {ramp.steps.map((step) => (
            <div
              key={step.name}
              style={{ flex: 1, backgroundColor: (!srgbPreview && supportsP3 && step.displayP3) || step.hex }}
            />
          ))}
        </div>
      </div>

      {/* Lock toggle */}
      <span
        role="button"
        aria-label={scale.lockedFromOverrides ? 'Unlock from overrides' : 'Lock from overrides'}
        title={scale.lockedFromOverrides ? 'Locked — click to unlock' : 'Click to lock from global overrides'}
        onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onToggleLock(); } }}
        tabIndex={0}
        style={{
          flexShrink: 0,
          color: scale.lockedFromOverrides ? 'var(--p-accent)' : 'var(--p-text-tertiary)',
          opacity: scale.lockedFromOverrides ? 1 : 0.45,
          cursor: 'pointer',
          lineHeight: 0,
          padding: '0 2px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <LockIcon locked={scale.lockedFromOverrides} />
      </span>
    </button>
  );
}

export function Sidebar() {
  const scales = usePaletteStore((s) => s.scales);
  const activeScaleId = usePaletteStore((s) => s.activeScaleId);
  const setActiveScale = usePaletteStore((s) => s.setActiveScale);
  const addScale = usePaletteStore((s) => s.addScale);
  const reorderScales = usePaletteStore((s) => s.reorderScales);
  const toggleScaleLock = usePaletteStore((s) => s.toggleScaleLock);
  const [newHex, setNewHex] = useState('#6366f1');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
        <div
          style={{ display: 'flex', flexDirection: 'column' }}
          onDragOver={(e) => {
            // Allow drop on the container itself (end of list)
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            // Drop on container = move to end
            if (dragIndex !== null && dragOverIndex === null) {
              reorderScales(dragIndex, scales.length - 1);
            }
            setDragIndex(null);
            setDragOverIndex(null);
          }}
        >
          {scales.map((scale, i) => {
            const showIndicator = dragOverIndex === i && dragIndex !== null && dragIndex !== i;
            return (
              <div key={scale.id}>
                {/* Drop indicator strip shown above this item */}
                <div style={{
                  height: showIndicator ? 4 : 0,
                  margin: showIndicator ? '2px 12px' : '0 12px',
                  borderRadius: 2,
                  background: 'var(--p-accent)',
                  transition: 'height 0.1s, margin 0.1s',
                  pointerEvents: 'none',
                }} />
                <ScaleItem
                  scale={scale}
                  isActive={effectiveActiveId === scale.id}
                  isDragging={dragIndex === i}
                  onClick={() => setActiveScale(scale.id)}
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={() => setDragOverIndex(i)}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== i) reorderScales(dragIndex, i);
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  onMoveUp={() => i > 0 && reorderScales(i, i - 1)}
                  onMoveDown={() => i < scales.length - 1 && reorderScales(i, i + 1)}
                  onToggleLock={() => toggleScaleLock(scale.id)}
                />
              </div>
            );
          })}
          {/* Drop indicator at the very end of the list */}
          {(() => {
            const showEnd = dragOverIndex !== null && dragOverIndex >= scales.length - 1
              && dragIndex !== null && dragIndex !== scales.length - 1;
            return (
              <div style={{
                height: showEnd ? 4 : 0,
                margin: showEnd ? '2px 12px' : '0 12px',
                borderRadius: 2,
                background: 'var(--p-accent)',
                transition: 'height 0.1s, margin 0.1s',
                pointerEvents: 'none',
              }} />
            );
          })()}
        </div>
      </div>

      {/* Add new scale */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--p-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <input
            type="color"
            value={newHex}
            onChange={(e) => setNewHex(e.target.value)}
            aria-label="New scale color"
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
            aria-label="New scale hex value"
            name="new-scale-hex"
            className="focus-visible-ring"
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 11,
              fontFamily: 'monospace',
              background: 'var(--p-bg)',
              border: '1px solid var(--p-border)',
              borderRadius: 4,
              color: 'var(--p-text)',
            }}
            placeholder="#6366f1"
          />
        </div>
        <button
          onClick={() => { addScale(newHex); setNewHex('#6366f1'); }}
          className="focus-visible-ring"
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
