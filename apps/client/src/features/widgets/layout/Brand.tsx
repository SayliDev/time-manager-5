export function Brand() {
  return (
    <div className='flex h-9 items-center'>
      <p className='relative flex gap-[0.26em] text-xl leading-tight tracking-[-0.035em] text-foreground'>
        <span className='font-bold'>Time</span>
        <span className='font-light'>Manager</span>
        <span
          aria-hidden
          className='absolute inset-x-0 -bottom-[0.18em] h-0.5 rounded-full bg-accent'
        />
      </p>
    </div>
  );
}
