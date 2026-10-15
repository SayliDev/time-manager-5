import { useId } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { TrendPoint } from '@/features/reports/types';

interface SparklineProps {
  data: TrendPoint[];
  color?: string;
}

export function Sparkline({ data, color = '--accent' }: SparklineProps) {
  const id = useId().replace(/:/g, '');
  return (
    <div aria-hidden className='h-12 w-full'>
      <ResponsiveContainer height='100%' width='100%'>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={id} x1='0' x2='0' y1='0' y2='1'>
              <stop
                offset='0%'
                stopColor={`var(${color})`}
                stopOpacity={0.35}
              />
              <stop offset='100%' stopColor={`var(${color})`} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            dataKey='value'
            fill={`url(#${id})`}
            isAnimationActive={false}
            stroke={`var(${color})`}
            strokeWidth={2}
            type='monotone'
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
