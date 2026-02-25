import { useState } from 'react';
import { usePaletteStore } from '../../store/paletteStore';
import { generateRamp } from '../../lib/colorMath';
import { exportToJSON } from '../../lib/exportTokens';

interface Props {
  onClose: () => void;
}

export function ExportModal({ onClose }: Props) {
  const scales = usePaletteStore((s) => s.scales);
  const ramps = scales.map((scale) => generateRamp(scale));
  const json = exportToJSON(ramps);
  const [copied, setCopied] = useState(false);

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
    a.download = 'design-tokens.json';
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
            Export — W3C Design Tokens
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
            Download .json
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
