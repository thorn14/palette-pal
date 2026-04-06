import { useState } from 'react';
import { usePaletteStore } from '../../store/paletteStore';
import { useGeneratedRamp } from '../../hooks/useGeneratedRamp';
import type { ColorScale } from '../../types/palette';

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

function DuplicateIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="9" height="9" rx="1.5" />
      <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
    </svg>
  );
}

function ScaleItem({
  scale,
  isActive,
  isSelected,
  isDragging,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onToggleSelect,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: {
  scale: ColorScale;
  isActive: boolean;
  isSelected: boolean;
  isDragging: boolean;
  onClick: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onToggleSelect: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const ramp = useGeneratedRamp(scale);
  const [hovered, setHovered] = useState(false);
  const srgbPreview = usePaletteStore((s) => s.srgbPreview);

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        background: isSelected
          ? 'var(--p-accent-subtle, rgba(99,102,241,0.12))'
          : isActive
            ? 'var(--p-bg-inset)'
            : 'transparent',
        border: `1px solid ${isSelected ? 'var(--p-accent, #6366f1)' : isActive ? 'var(--p-border)' : 'transparent'}`,
        opacity: isDragging ? 0.35 : 1,
        cursor: 'grab',
        transition: 'opacity 0.1s',
        userSelect: 'none',
        position: 'relative',
        width: '100%',
        textAlign: 'left',
      }}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
        style={{
          flexShrink: 0,
          width: 14,
          height: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered || isSelected ? 1 : 0,
          transition: 'opacity 0.1s',
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          style={{ width: 12, height: 12, cursor: 'pointer', margin: 0, accentColor: 'var(--p-accent, #6366f1)' }}
        />
      </div>

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

      {/* Duplicate button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
        title="Duplicate scale"
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'none',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          color: 'var(--p-text-tertiary)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.1s, color 0.1s',
          padding: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--p-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--p-text-tertiary)')}
      >
        <DuplicateIcon />
      </button>
    </button>
  );
}

export function Sidebar() {
  const scales = usePaletteStore((s) => s.scales);
  const activeScaleId = usePaletteStore((s) => s.activeScaleId);
  const selectedScaleIds = usePaletteStore((s) => s.selectedScaleIds);
  const setActiveScale = usePaletteStore((s) => s.setActiveScale);
  const addScale = usePaletteStore((s) => s.addScale);
  const reorderScales = usePaletteStore((s) => s.reorderScales);
  const duplicateScale = usePaletteStore((s) => s.duplicateScale);
  const toggleSelectScale = usePaletteStore((s) => s.toggleSelectScale);
  const selectAllScales = usePaletteStore((s) => s.selectAllScales);
  const clearSelection = usePaletteStore((s) => s.clearSelection);
  const removeSelectedScales = usePaletteStore((s) => s.removeSelectedScales);
  const [newHex, setNewHex] = useState('#6366f1');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const effectiveActiveId = activeScaleId ?? scales[0]?.id;
  const hasSelection = selectedScaleIds.length > 0;

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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Scales</span>
        {scales.length > 0 && (
          <button
            onClick={hasSelection ? clearSelection : selectAllScales}
            style={{
              padding: 0,
              fontSize: 10,
              background: 'none',
              border: 'none',
              color: 'var(--p-text-tertiary)',
              cursor: 'pointer',
              textTransform: 'none',
              letterSpacing: 'normal',
              fontWeight: 400,
            }}
          >
            {hasSelection ? 'None' : 'All'}
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {hasSelection && (
        <div
          style={{
            padding: '6px 12px',
            borderBottom: '1px solid var(--p-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            background: 'var(--p-accent-subtle, rgba(99,102,241,0.08))',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--p-text-secondary)' }}>
            {selectedScaleIds.length} selected
          </span>
          <button
            onClick={removeSelectedScales}
            style={{
              padding: '3px 8px',
              fontSize: 11,
              background: 'none',
              border: '1px solid var(--p-danger, #ef4444)',
              borderRadius: 4,
              color: 'var(--p-danger, #ef4444)',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      )}

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
                  isSelected={selectedScaleIds.includes(scale.id)}
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
                  onToggleSelect={() => toggleSelectScale(scale.id)}
                  onDuplicate={() => duplicateScale(scale.id)}
                  onMoveUp={() => i > 0 && reorderScales(i, i - 1)}
                  onMoveDown={() => i < scales.length - 1 && reorderScales(i, i + 1)}
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
