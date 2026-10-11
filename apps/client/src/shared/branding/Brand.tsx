import { Clock } from '@gravity-ui/icons';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className='flex items-center gap-2.5'>
      <span
        aria-hidden
        className='flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground'
      >
        <Clock className='size-5' />
      </span>
      {compact ? null : (
        <div className='leading-tight'>
          <p className='text-sm font-semibold tracking-tight text-foreground'>
            Time Manager
          </p>
          <p className='text-[11px] font-medium uppercase tracking-wider text-muted'>
            TrinityMarket
          </p>
        </div>
      )}
    </div>
  );
}
