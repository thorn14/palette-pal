import { useState } from 'react';
import { tryParseHex } from '../../lib/colorMath';

interface Props {
  value: string;
  onChange: (hex: string) => void;
  label?: string;
}

export function ColorInput({ value, onChange, label = 'Source color' }: Props) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    setDraft(raw);
    const hex = raw.startsWith('#') ? raw : `#${raw}`;
    const parsed = tryParseHex(hex);
    if (parsed) {
      setError(false);
      onChange(hex.toLowerCase());
    } else {
      setError(true);
    }
  }

  function handleColorPicker(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value;
    setDraft(hex);
    setError(false);
    onChange(hex);
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-neutral-400">{label}</label>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith('#') ? value : `#${value}`}
          onChange={handleColorPicker}
          className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent p-0"
          title="Pick color"
        />
        <input
          type="text"
          value={draft}
          onChange={handleChange}
          placeholder="#1894f8"
          className={`flex-1 bg-neutral-800 border rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:ring-2 transition-colors
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-neutral-700 focus:ring-blue-500'}`}
          spellCheck={false}
        />
        {error && <span className="text-xs text-red-400">Invalid hex</span>}
      </div>
    </div>
  );
}
