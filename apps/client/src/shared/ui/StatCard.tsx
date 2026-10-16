import { ArrowDown, ArrowUp } from '@gravity-ui/icons';
import { Card, Chip } from '@heroui/react';
import type { ComponentType, SVGProps } from 'react';
import type { TrendPoint } from '@/features/reports/types';
import { Sparkline } from '@/shared/charts/Sparkline';
import { formatDecimal } from '@/shared/lib/format';

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  delta?: number;
  positiveIsGood?: boolean;
  hint?: string;
  trend?: TrendPoint[];
  tone?: 'accent' | 'success' | 'warning' | 'danger';
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  accent: 'bg-accent-soft text-accent-soft-foreground',
  success: 'bg-success-soft text-success-soft-foreground',
  warning: 'bg-warning-soft text-warning-soft-foreground',
  danger: 'bg-danger-soft text-danger-soft-foreground',
};

const toneVar: Record<NonNullable<StatCardProps['tone']>, string> = {
  accent: '--accent',
  success: '--success',
  warning: '--warning',
  danger: '--danger',
};

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  delta,
  positiveIsGood = true,
  hint,
  trend,
  tone = 'accent',
}: StatCardProps) {
  const isGood = delta === undefined ? true : delta > 0 === positiveIsGood;
  const DeltaIcon = delta !== undefined && delta < 0 ? ArrowDown : ArrowUp;

  return (
    <Card className='gap-3 overflow-hidden'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium text-muted'>{label}</p>
          <p className='tabular mt-1 flex items-baseline gap-1 text-3xl font-semibold tracking-tight text-foreground'>
            {value}
            {unit ? (
              <span className='text-lg font-medium text-muted'>{unit}</span>
            ) : null}
          </p>
        </div>
        <span
          aria-hidden
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
        >
          <Icon className='size-5' />
        </span>
      </div>

      {trend ? <Sparkline color={toneVar[tone]} data={trend} /> : null}

      <div className='flex items-center gap-2 text-xs'>
        {delta !== undefined ? (
          <Chip color={isGood ? 'success' : 'danger'} size='sm' variant='soft'>
            <DeltaIcon width={10} />
            <Chip.Label className='tabular'>
              {formatDecimal(Math.abs(delta))} %
            </Chip.Label>
          </Chip>
        ) : null}
        {hint ? <span className='truncate text-muted'>{hint}</span> : null}
      </div>
    </Card>
  );
}
