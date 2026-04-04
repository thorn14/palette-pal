import type { GeneratedStep } from '../../types/palette';
import { getContrast } from '../../lib/colorMath';
import { ContrastBadge } from '../accessibility/ContrastBadge';
import { usePaletteStore } from '../../store/paletteStore';

const supportsP3 = typeof CSS !== 'undefined' && CSS.supports('color', 'color(display-p3 0 0 0)');

interface Props {
  step: GeneratedStep;
  isActive?: boolean;
  onClick?: () => void;
}

export function Swatch({ step, isActive, onClick }: Props) {
  const srgbPreview = usePaletteStore((s) => s.srgbPreview);
  const contrastWhite = getContrast(step.hex, '#ffffff');
  const contrastBlack = getContrast(step.hex, '#000000');
  const textColor = contrastBlack.ratio > contrastWhite.ratio ? '#000000' : '#ffffff';
  const bestContrast = contrastBlack.ratio > contrastWhite.ratio ? contrastBlack : contrastWhite;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start justify-end p-2 rounded transition-all cursor-pointer
        ${isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-105' : 'hover:scale-[1.03]'}
      `}
      style={{ backgroundColor: (!srgbPreview && supportsP3 && step.displayP3) || step.hex, minHeight: '80px', minWidth: '64px' }}
      title={`${step.name}: ${step.hex}`}
    >
      <span className="text-[10px] font-mono font-medium leading-tight" style={{ color: textColor }}>
        {step.name}
      </span>
      <span className="text-[9px] font-mono opacity-80 leading-tight" style={{ color: textColor }}>
        {step.hex}
      </span>
      <div className="mt-1">
        <ContrastBadge level={bestContrast.level} ratio={bestContrast.ratio} showRatio />
      </div>
    </button>
  );
}
