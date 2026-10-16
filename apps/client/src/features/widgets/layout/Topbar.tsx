import {
  Bars,
  Bell,
  CircleCheck,
  Clock,
  Magnifier,
  TriangleExclamation,
} from '@gravity-ui/icons';
import {
  Badge,
  Breadcrumbs,
  Button,
  Description,
  Dropdown,
  Header,
  Kbd,
  Label,
} from '@heroui/react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SearchModal } from '@/features/search/components/SearchDialog';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { pageTitles } from './nav';

interface TopbarProps {
  onOpenMenu: () => void;
}

export function Topbar({ onOpenMenu }: TopbarProps) {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] ?? 'Page';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <header className='sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-separator bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8'>
        <Button
          isIconOnly
          aria-label='Ouvrir le menu'
          className='lg:hidden'
          size='sm'
          variant='ghost'
          onPress={onOpenMenu}
        >
          <Bars />
        </Button>

        <Breadcrumbs className='hidden sm:flex'>
          <Breadcrumbs.Item href='/'>Time Manager</Breadcrumbs.Item>
          <Breadcrumbs.Item>{title}</Breadcrumbs.Item>
        </Breadcrumbs>
        <p className='truncate text-sm font-semibold sm:hidden'>{title}</p>

        <div className='ml-auto flex items-center gap-1.5'>
          <button
            aria-label='Ouvrir la recherche'
            className='hidden h-9 w-72 cursor-pointer items-center gap-2 rounded-lg border border-transparent bg-default px-3 text-left text-sm text-muted transition-colors hover:bg-default/80 md:flex'
            type='button'
            onClick={() => setIsOpen(true)}
          >
            <Magnifier className='size-4 shrink-0' />
            <span className='min-w-0 flex-1 truncate'>
              Rechercher un employé, une équipe…
            </span>
            <Kbd className='shrink-0' variant='light'>
              <Kbd.Abbr keyValue='command' />
              <Kbd.Content>K</Kbd.Content>
            </Kbd>
          </button>

          <ThemeToggle />

          <Dropdown>
            <Badge.Anchor>
              <Button
                isIconOnly
                aria-label='Notifications (3 non lues)'
                size='sm'
                variant='ghost'
              >
                <Bell />
              </Button>
              <Badge color='danger' size='sm'>
                3
              </Badge>
            </Badge.Anchor>
            <Dropdown.Popover className='min-w-[320px]'>
              <Dropdown.Menu aria-label='Notifications'>
                <Dropdown.Section>
                  <Header>Notifications</Header>
                  <Dropdown.Item id='n1' textValue='Retard détecté'>
                    <TriangleExclamation className='mt-0.5 size-4 shrink-0 text-warning' />
                    <div className='flex flex-col'>
                      <Label>Retard détecté</Label>
                      <Description>Sara Moreau — arrivée à 09:41</Description>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id='n2' textValue='Pointage manquant'>
                    <Clock className='mt-0.5 size-4 shrink-0 text-danger' />
                    <div className='flex flex-col'>
                      <Label>Pointage manquant</Label>
                      <Description>
                        Hugo Lefèvre — aucun pointage depuis 2 jours
                      </Description>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item id='n3' textValue='Rapport prêt'>
                    <CircleCheck className='mt-0.5 size-4 shrink-0 text-success' />
                    <div className='flex flex-col'>
                      <Label>Rapport hebdomadaire prêt</Label>
                      <Description>
                        Les KPIs de la semaine sont disponibles
                      </Description>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Section>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>
      <SearchModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
