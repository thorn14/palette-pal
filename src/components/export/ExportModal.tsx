import { useState } from 'react';
import { usePaletteStore } from '../../store/paletteStore';
import { generateRamp } from '../../lib/colorMath';
import { exportToJSON } from '../../lib/exportTokens';
import { exportContrastMapJSON } from '../../lib/exportContrastMap';

interface Props {
  onClose: () => void;
}

type Tab = 'tokens' | 'contrast';

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

export function ExportModal({ onClose }: Props) {
  const scales = usePaletteStore((s) => s.scales);
  const ramps = scales.map((scale) => generateRamp(scale));
  const tokensJson = exportToJSON(ramps);
  const contrastJson = exportContrastMapJSON(ramps);

  const [activeTab, setActiveTab] = useState<Tab>('tokens');
  const [copied, setCopied] = useState(false);

  const json = activeTab === 'tokens' ? tokensJson : contrastJson;
  const downloadName = activeTab === 'tokens' ? 'design-tokens.json' : 'contrast-map.json';

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
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
          <button style={tabStyle(activeTab === 'contrast')} onClick={() => { setActiveTab('contrast'); setCopied(false); }}>
            Contrast Map
          </button>
        </div>

        {/* JSON content */}
        <pre
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 20,
            margin: 0,
            fontSize: 12,
            fontFamily: 'monospace',
            color: 'var(--p-text-secondary)',
            background: 'var(--p-bg-subtle)',
            whiteSpace: 'pre',
          }}
        >
          {json}
        </pre>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '14px 20px',
            borderTop: '1px solid var(--p-border)',
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
            onClick={handleDownload}
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
