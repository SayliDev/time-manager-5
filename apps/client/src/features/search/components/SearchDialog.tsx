import { Magnifier, Persons } from '@gravity-ui/icons';
import { Kbd, Modal, ToggleButton, ToggleButtonGroup, cn } from '@heroui/react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type SVGProps,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { fullName, teams, users } from '@/data/mock';

type Scope = 'pages' | 'people';

type SearchItem = {
  id: string;
  label: string;
  description?: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

function matchesQuery(text: string, query: string) {
  return text.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'));
}

export function SearchModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [scope, setScope] = useState<Scope>('pages');
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
  }, [isOpen, inputRef]);

  const pageItems = useMemo<SearchItem[]>(() => {
    return [];
  }, []);

  const peopleItems = useMemo<SearchItem[]>(() => {
    return users.map((user) => {
      const team = teams.find((t) => t.id === user.teamId);
      return {
        id: `user-${user.id}`,
        label: fullName(user),
        description: team?.name ?? user.email,
        to: '/users',
        icon: Persons,
      };
    });
  }, []);

  const items = useMemo(() => {
    const source = scope === 'pages' ? pageItems : peopleItems;
    const q = query.trim();
    if (!q) return source;
    return source.filter(
      (item) =>
        matchesQuery(item.label, q) ||
        (item.description ? matchesQuery(item.description, q) : false)
    );
  }, [scope, pageItems, peopleItems, query]);

  const selectItem = (item: SearchItem) => {
    onOpenChange(false);
    navigate(item.to);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (items.length === 0 ? 0 : (i + 1) % items.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) =>
        items.length === 0 ? 0 : (i - 1 + items.length) % items.length
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) selectItem(item);
    }
  };

  const emptyLabel =
    scope === 'pages' ? 'Aucune page trouvée' : 'Aucun employé trouvé';

  return (
    <Modal.Backdrop isOpen={isOpen} variant='blur' onOpenChange={onOpenChange}>
      <Modal.Container className='pt-[12vh]' placement='top' size='md'>
        <Modal.Dialog className='overflow-hidden rounded-2xl border border-separator bg-background p-0 shadow-2xl sm:max-w-[560px]'>
          <Modal.Heading className='sr-only'>
            Recherche Time Manager
          </Modal.Heading>

          <div className='flex flex-col gap-3 px-4 pt-4 pb-3'>
            <ToggleButtonGroup
              disallowEmptySelection
              aria-label='Périmètre de recherche'
              className='w-fit gap-1.5'
              selectedKeys={[scope]}
              selectionMode='single'
              size='sm'
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next === 'pages' || next === 'people') setScope(next);
              }}
            >
              <ToggleButton
                className='rounded-full px-3 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground'
                id='pages'
              >
                Pages
              </ToggleButton>
              <ToggleButton
                className='rounded-full px-3 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground'
                id='people'
              >
                Employés
              </ToggleButton>
            </ToggleButtonGroup>

            <div className='flex items-center gap-3'>
              <Magnifier className='size-5 shrink-0 text-muted' />
              <input
                ref={inputRef}
                aria-autocomplete='list'
                aria-controls='tm-search-results'
                aria-label='Rechercher'
                className='min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted'
                placeholder={
                  scope === 'pages'
                    ? 'Que recherchez-vous ?'
                    : 'Rechercher un employé…'
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <Kbd className='shrink-0' variant='light'>
                <Kbd.Content>ESC</Kbd.Content>
              </Kbd>
            </div>
          </div>

          <div className='border-t border-separator' />

          <ul
            aria-label='Résultats de recherche'
            className='max-h-[min(52vh,420px)] overflow-y-auto p-2'
            id='tm-search-results'
            role='listbox'
          >
            {items.length === 0 ? (
              <li className='px-3 py-8 text-center text-sm text-muted'>
                {emptyLabel}
              </li>
            ) : (
              items.map((item, index) => {
                const Icon = item.icon;
                const selected = index === activeIndex;
                return (
                  <li key={item.id} aria-selected={selected} role='option'>
                    <button
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                        selected
                          ? 'bg-default text-foreground'
                          : 'text-foreground hover:bg-default/70'
                      )}
                      type='button'
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <Icon className='size-[18px] shrink-0 text-muted' />
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate text-sm font-medium'>
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className='block truncate text-xs text-muted'>
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
