import { Skeleton } from '@heroui/react';

/** Hauteurs (en %) volontairement irrégulières pour évoquer un vrai graphique. */
const BAR_HEIGHTS = [64, 82, 56, 90, 72, 38, 26];
const GRID_LINES = [25, 50, 75, 100];

interface ChartSkeletonProps {
  height?: number;
  bars?: number;
  /** Deux barres par groupe + légende, comme HoursBarChart en mode compareModes. */
  grouped?: boolean;
}

export function ChartSkeleton({
  height = 260,
  bars = 7,
  grouped = false,
}: ChartSkeletonProps) {
  return (
    <div aria-hidden className='flex w-full flex-col' style={{ height }}>
      <div className='flex min-h-0 flex-1 gap-2'>
        <div className='flex w-7 flex-col-reverse justify-between pb-6'>
          {[0, ...GRID_LINES].map((line) => (
            <Skeleton className='h-2.5 w-full rounded-sm' key={line} />
          ))}
        </div>

        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='relative flex min-h-0 flex-1 items-end justify-around gap-2 border-b border-separator px-2'>
            {GRID_LINES.map((line) => (
              <span
                className='pointer-events-none absolute inset-x-0 border-t border-dashed border-separator'
                key={line}
                style={{ bottom: `${line}%` }}
              />
            ))}
            {Array.from({ length: bars }, (_, i) => {
              const barHeight = BAR_HEIGHTS[i % BAR_HEIGHTS.length]!;
              return (
                <div
                  className='flex h-full max-w-14 flex-1 items-end justify-center gap-1'
                  key={i}
                >
                  <Skeleton
                    className='w-full max-w-7 rounded-t-md rounded-b-xs'
                    style={{ height: `${barHeight}%` }}
                  />
                  {grouped ? (
                    <Skeleton
                      className='w-full max-w-7 rounded-t-md rounded-b-xs'
                      style={{ height: `${Math.round(barHeight * 0.45)}%` }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className='flex h-6 items-center justify-around gap-2 px-2'>
            {Array.from({ length: bars }, (_, i) => (
              <Skeleton className='h-2.5 w-7 rounded-sm' key={i} />
            ))}
          </div>
        </div>
      </div>

      {grouped ? (
        <div className='flex h-6 items-center justify-center gap-4'>
          <Skeleton className='h-2.5 w-20 rounded-sm' />
          <Skeleton className='h-2.5 w-20 rounded-sm' />
        </div>
      ) : null}
    </div>
  );
}
