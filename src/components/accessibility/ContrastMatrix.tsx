import type { GeneratedRamp } from '../../types/palette';
import { useContrastMatrix } from '../../hooks/useContrastMatrix';
import { ContrastBadge } from './ContrastBadge';

interface Props {
  ramp: GeneratedRamp;
}

export function ContrastMatrix({ ramp }: Props) {
  const matrix = useContrastMatrix(ramp);
  const stepNames = ramp.steps.map((s) => s.name);

  return (
    <div className="overflow-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="w-10 h-8" />
            {stepNames.map((name) => (
              <th key={name} className="w-12 h-8 text-center text-neutral-400 font-medium px-1">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, ri) => (
            <tr key={ri}>
              <td className="text-neutral-400 font-medium pr-2 text-right">{stepNames[ri]}</td>
              {row.map((cell, ci) => (
                <td key={ci} className="p-0.5 text-center">
                  {ri === ci ? (
                    <span className="text-neutral-700">—</span>
                  ) : (
                    <ContrastBadge level={cell.result.level} ratio={cell.result.ratio} showRatio />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
