import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DayHours } from '@/features/time/types';
import { ChartTooltip } from './ChartTooltip';

interface HoursBarChartProps {
  data: DayHours[];
  target?: number;
  targetLabel?: string;
  height?: number;
  unit?: string;
}

export function HoursBarChart({
  data,
  target,
  targetLabel,
  height = 260,
  unit = 'h',
}: HoursBarChartProps) {
  const max = Math.max(...data.map((d) => d.hours), target ?? 0);
  const step = [1, 2, 5, 10, 20, 50].find((s) => (max * 1.1) / s <= 5) ?? 50;
  const ceiling = Math.ceil((max * 1.1) / step) * step;
  const ticks = Array.from({ length: ceiling / step + 1 }, (_, i) => i * step);

  return (
    <div className='w-full' style={{ height }}>
      <ResponsiveContainer height='100%' width='100%'>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            stroke='var(--separator)'
            strokeDasharray='3 3'
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey='day'
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            domain={[0, ceiling]}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            ticks={ticks}
            width={44}
          />
          <Tooltip
            content={<ChartTooltip unit={unit} />}
            isAnimationActive={false}
            cursor={{ fill: 'var(--default)', opacity: 0.5, radius: 4 }}
          />
          {target ? (
            <ReferenceLine
              ifOverflow='extendDomain'
              label={
                targetLabel
                  ? {
                      value: targetLabel,
                      position: 'insideTopRight',
                      fill: 'var(--muted)',
                      fontSize: 11,
                    }
                  : undefined
              }
              stroke='var(--muted)'
              strokeDasharray='5 4'
              y={target}
            />
          ) : null}
          <Bar
            animationDuration={600}
            dataKey='hours'
            fill='var(--accent)'
            maxBarSize={44}
            radius={[4, 4, 2, 2]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
