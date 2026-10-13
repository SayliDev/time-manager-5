import { Clock, Shield } from '@gravity-ui/icons';

function LoginHero({ features }: { features: { icon: React.ElementType, title: string, text: string }[] }) {

  return (
    <aside className='tm-hero-bg relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex'>
      <div className='flex items-center gap-2.5'>
        <span className='flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur'>
          <Clock className='size-5' />
        </span>
        <div className='leading-tight'>
          <p className='text-sm font-semibold'>Time Manager</p>
          <p className='text-[11px] font-medium uppercase tracking-wider text-white/60'>
            TrinityMarket
          </p>
        </div>
      </div>

      <div className='max-w-md'>
        <h2 className='text-4xl leading-[1.1] font-semibold tracking-tight'>
          Le temps de travail,{' '}
          <span className='text-white/60'>enfin clair.</span>
        </h2>
        <p className='mt-4 text-base text-white/70'>
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem
        </p>

        <ul className='mt-10 flex flex-col gap-5'>
          {features.map(({ icon: Icon, title, text }) => (
            <li className='flex items-start gap-4' key={title}>
              <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur'>
                <Icon className='size-5' />
              </span>
              <div>
                <p className='text-sm font-medium'>{title}</p>
                <p className='text-sm text-white/60'>{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className='flex items-center gap-2 text-xs text-white/50'>
        <Shield className='size-4' />
        Données chiffrées · Conforme RGPD · Authentification sécurisée
      </p>
    </aside>
  )
}

export default LoginHero;