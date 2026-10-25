interface AppLoaderProps {
  label?: string;
}

export function AppLoader({
  label = 'Vérification de la session',
}: AppLoaderProps) {
  return (
    <div
      className='flex min-h-svh items-center justify-center bg-background'
      role='status'
    >
      <span className='sr-only'>{label}</span>
      <div
        aria-hidden
        className='tm-loader relative flex gap-[0.26em] text-[2.1rem] leading-[1.15] tracking-[-0.035em] text-foreground'
      >
        <span className='tm-loader-mask'>
          <span className='tm-loader-word font-bold'>Time</span>
        </span>
        <span className='tm-loader-mask'>
          <span className='tm-loader-word tm-loader-word--late font-light'>
            Manager
          </span>
        </span>
        <span className='tm-loader-line' />
      </div>
    </div>
  );
}
