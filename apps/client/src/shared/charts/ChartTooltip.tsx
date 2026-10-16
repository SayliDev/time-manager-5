interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    value?: number | string;
    name?: string;
    color?: string;
    dataKey?: string | number;
  }>;
  label?: string | number;
  unit?: string;
}

const SERIES_LABELS: Record<string, string> = {
  hours: 'Total',
  onsite: 'Présentiel',
  remote: 'Télétravail',
};

export function ChartTooltip({
  active,
  payload,
  label,
  unit = 'h',
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className='rounded-lg border border-border bg-overlay px-3 py-2 text-xs shadow-overlay'>
      <p className='text-muted'>{label}</p>
      <ul className='mt-1.5 flex flex-col gap-1'>
        {payload.map((entry) => {
          const key = String(entry.dataKey ?? entry.name ?? '');
          const name = SERIES_LABELS[key] ?? entry.name ?? key;
          return (
            <li
              className='flex items-center justify-between gap-4'
              key={key}
            >
              <span className='flex items-center gap-1.5 text-muted'>
                <span
                  aria-hidden
                  className='size-2 shrink-0 rounded-full'
                  style={{ background: entry.color }}
                />
                {name}
              </span>
              <span className='tabular font-semibold text-foreground'>
                {entry.value}
                <span className='ml-0.5 font-normal text-muted'>{unit}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
