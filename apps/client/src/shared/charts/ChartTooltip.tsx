interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string }>;
  label?: string | number;
  unit?: string;
}

export function ChartTooltip({
  active,
  payload,
  label,
  unit = 'h',
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className='rounded-lg border border-border bg-overlay px-3 py-2 text-xs shadow-overlay'>
      <p className='text-muted'>{label}</p>
      <p className='tabular mt-0.5 text-sm font-semibold text-foreground'>
        {value}
        <span className='ml-0.5 font-normal text-muted'>{unit}</span>
      </p>
    </div>
  );
}
