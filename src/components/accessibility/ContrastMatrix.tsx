import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { GeneratedRamp } from '../../types/palette';
import { useContrastMatrix } from '../../hooks/useContrastMatrix';
import { ContrastBadge } from './ContrastBadge';

interface Props {
  ramp: GeneratedRamp;
}

export function ContrastMatrix({ ramp }: Props) {
  const matrix = useContrastMatrix(ramp);
  const stepNames = ramp.steps.map((s) => s.name);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: matrix.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="overflow-auto" style={{ maxHeight: 480 }}>
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="w-10 h-8 sticky top-0 bg-neutral-900 z-10" />
            {stepNames.map((name) => (
              <th key={name} className="w-12 h-8 text-center text-neutral-400 font-medium px-1 sticky top-0 bg-neutral-900 z-10">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const ri = vRow.index;
            const row = matrix[ri];
            return (
              <tr
                key={ri}
                style={{
                  position: 'absolute',
                  top: vRow.start,
                  left: 0,
                  width: '100%',
                  height: vRow.size,
                  display: 'table-row',
                }}
              >
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
