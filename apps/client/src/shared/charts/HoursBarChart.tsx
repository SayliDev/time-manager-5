import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  /** Affiche présentiel vs télétravail côte à côte. */
  compareModes?: boolean;
}

export function HoursBarChart({
  data,
  target,
  targetLabel,
  height = 260,
  unit = 'h',
  compareModes = false,
}: HoursBarChartProps) {
  const showModes =
    compareModes &&
    data.some((d) => d.onsite != null || d.remote != null);

  const values = data.flatMap((d) =>
    showModes
      ? [d.onsite ?? 0, d.remote ?? 0]
      : [d.hours]
  );
  const max = Math.max(...values, target ?? 0);
  const step = [1, 2, 5, 10, 20, 50].find((s) => (max * 1.1) / s <= 5) ?? 50;
  const ceiling = Math.ceil((max * 1.1) / step) * step;
  const ticks = Array.from({ length: ceiling / step + 1 }, (_, i) => i * step);

  return (
    <div className='w-full' style={{ height }}>
      <ResponsiveContainer height='100%' width='100%'>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: showModes ? 8 : 0, left: -16 }}
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
          {showModes ? (
            <Legend
              formatter={(value) =>
                value === 'onsite' ? 'Présentiel' : 'Télétravail'
              }
              iconSize={8}
              iconType='circle'
              wrapperStyle={{ fontSize: 12, color: 'var(--muted)' }}
            />
          ) : null}
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
          {showModes ? (
            <>
              <Bar
                animationDuration={600}
                dataKey='onsite'
                fill='var(--accent)'
                maxBarSize={28}
                name='onsite'
                radius={[4, 4, 2, 2]}
              />
              <Bar
                animationDuration={600}
                dataKey='remote'
                fill='var(--success)'
                maxBarSize={28}
                name='remote'
                radius={[4, 4, 2, 2]}
              />
            </>
          ) : (
            <Bar
              animationDuration={600}
              dataKey='hours'
              fill='var(--accent)'
              maxBarSize={44}
              radius={[4, 4, 2, 2]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
