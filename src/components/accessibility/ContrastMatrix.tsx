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
  const colCount = stepNames.length + 1; // +1 for row header
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: matrix.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 32,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="overflow-auto" style={{ maxHeight: 480 }}>
      <div
        role="grid"
        aria-label="Contrast matrix"
        className="text-xs"
        style={{ display: 'grid', gridTemplateColumns: `2.5rem repeat(${stepNames.length}, 3rem)` }}
      >
        {/* Sticky header row */}
        <div role="row" className="contents">
          <div role="columnheader" className="h-8 sticky top-0 bg-neutral-900 z-10" />
          {stepNames.map((name) => (
            <div key={name} role="columnheader" className="h-8 flex items-center justify-center text-neutral-400 font-medium px-1 sticky top-0 bg-neutral-900 z-10">
              {name}
            </div>
          ))}
        </div>

        {/* Virtualized body */}
        <div
          style={{
            height: rowVirtualizer.getTotalSize(),
            position: 'relative',
            gridColumn: `1 / ${colCount + 1}`,
          }}
        >
          {rowVirtualizer.getVirtualItems().map((vRow) => {
            const ri = vRow.index;
            const row = matrix[ri];
            return (
              <div
                key={ri}
                role="row"
                style={{
                  position: 'absolute',
                  top: vRow.start,
                  left: 0,
                  right: 0,
                  height: vRow.size,
                  display: 'grid',
                  gridTemplateColumns: `2.5rem repeat(${stepNames.length}, 3rem)`,
                  alignItems: 'center',
                }}
              >
                <div role="rowheader" className="text-neutral-400 font-medium pr-2 text-right">{stepNames[ri]}</div>
                {row.map((cell, ci) => (
                  <div key={ci} role="gridcell" className="p-0.5 text-center">
                    {ri === ci ? (
                      <span className="text-neutral-700">—</span>
                    ) : (
                      <ContrastBadge level={cell.result.level} ratio={cell.result.ratio} showRatio />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
