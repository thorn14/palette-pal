import type { GeneratedRamp } from '../../types/palette';
import { useAdjacentContrasts } from '../../hooks/useContrastMatrix';
import { ContrastBadge } from './ContrastBadge';

interface Props {
  ramp: GeneratedRamp;
}

export function AdjacentContrastRow({ ramp }: Props) {
  const contrasts = useAdjacentContrasts(ramp);

  return (
    <div className="flex gap-1 px-1">
      {/* Empty first cell to align with swatches */}
      <div className="flex-1" />
      {contrasts.map((result, i) => (
        <div key={i} className="flex-1 flex justify-center">
          <ContrastBadge level={result.level} ratio={result.ratio} showRatio />
        </div>
      ))}
      <div className="flex-1" />
    </div>
  );
}
