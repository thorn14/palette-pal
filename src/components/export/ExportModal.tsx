import { useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePaletteStore } from '../../store/paletteStore';
import { generateRamp } from '../../lib/colorMath';
import { exportToJSON } from '../../lib/exportTokens';
import { exportWcagContrastMapJSON, exportApcaContrastMapJSON } from '../../lib/exportContrastMap';

interface Props {
  onClose: () => void;
}

type Tab = 'tokens' | 'contrast-wcag' | 'contrast-apca';

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 500,
  background: active ? 'var(--p-bg-inset)' : 'transparent',
  border: 'none',
  borderBottom: active ? '2px solid var(--p-accent)' : '2px solid transparent',
  cursor: 'pointer',
  color: active ? 'var(--p-text)' : 'var(--p-text-secondary)',
});

function VirtualizedPre({ text }: { text: string }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => text.split('\n'), [text]);

  const virtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 18,
    overscan: 30,
  });

  return (
    <div
      ref={parentRef}
      style={{
        flex: 1,
        overflow: 'auto',
        background: 'var(--p-bg-subtle)',
        padding: '12px 0',
      }}
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vItem) => (
          <div
            key={vItem.index}
            style={{
              position: 'absolute',
              top: vItem.start,
              left: 0,
              right: 0,
              height: vItem.size,
              padding: '0 20px',
              fontSize: 12,
              fontFamily: 'monospace',
              color: 'var(--p-text-secondary)',
              whiteSpace: 'pre',
              lineHeight: '18px',
            }}
          >
            {lines[vItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}

function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportModal({ onClose }: Props) {
  const scales = usePaletteStore((s) => s.scales);
  const ramps = useMemo(() => scales.map((scale) => generateRamp(scale)), [scales]);

  const tokensJson = useMemo(() => exportToJSON(ramps), [ramps]);
  const wcagJson = useMemo(() => exportWcagContrastMapJSON(ramps), [ramps]);
  const apcaJson = useMemo(() => exportApcaContrastMapJSON(ramps), [ramps]);

  const [activeTab, setActiveTab] = useState<Tab>('tokens');
  const [copied, setCopied] = useState(false);

  const json = activeTab === 'tokens' ? tokensJson : activeTab === 'contrast-wcag' ? wcagJson : apcaJson;
  const downloadName =
    activeTab === 'tokens' ? 'design-tokens.json'
    : activeTab === 'contrast-wcag' ? 'contrast-map-wcag.json'
    : 'contrast-map-apca.json';

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        zIndex: 50,
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
          maxWidth: 680,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: '1px solid var(--p-border)',
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-text)', margin: 0 }}>
            Export
          </h2>
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--p-border)',
            padding: '0 8px',
          }}
        >
          <button style={tabStyle(activeTab === 'tokens')} onClick={() => { setActiveTab('tokens'); setCopied(false); }}>
            Design Tokens
          </button>
          <button style={tabStyle(activeTab === 'contrast-wcag')} onClick={() => { setActiveTab('contrast-wcag'); setCopied(false); }}>
            Contrast — WCAG
          </button>
          <button style={tabStyle(activeTab === 'contrast-apca')} onClick={() => { setActiveTab('contrast-apca'); setCopied(false); }}>
            Contrast — APCA
          </button>
        </div>

        {/* Virtualized JSON content */}
        <VirtualizedPre text={json} />

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 20px',
            borderTop: '1px solid var(--p-border)',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              background: 'var(--p-bg-subtle)',
              border: '1px solid var(--p-border)',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--p-text)',
            }}
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </button>
          <button
            onClick={() => downloadJSON(json, downloadName)}
            style={{
              padding: '6px 14px',
              fontSize: 13,
              background: 'var(--p-accent)',
              border: '1px solid var(--p-accent)',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Download {downloadName}
          </button>
          {activeTab === 'tokens' && (
            <>
              <button
                onClick={() => downloadJSON(wcagJson, 'contrast-map-wcag.json')}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  background: 'var(--p-bg-subtle)',
                  border: '1px solid var(--p-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--p-text-secondary)',
                }}
              >
                + WCAG Map
              </button>
              <button
                onClick={() => downloadJSON(apcaJson, 'contrast-map-apca.json')}
                style={{
                  padding: '6px 14px',
                  fontSize: 12,
                  background: 'var(--p-bg-subtle)',
                  border: '1px solid var(--p-border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--p-text-secondary)',
                }}
              >
                + APCA Map
              </button>
            </>
          )}
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              fontSize: 13,
              background: 'transparent',
              border: 'none',
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
