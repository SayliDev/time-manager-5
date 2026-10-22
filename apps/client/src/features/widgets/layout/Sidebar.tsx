import {
  ArrowRightFromSquare,
  ChevronsExpandHorizontal,
  Gear,
  PersonWorker,
  Shield,
} from '@gravity-ui/icons';
import {
  Avatar,
  Button,
  Dropdown,
  Kbd,
  Label,
  Separator,
  cn,
  toast,
} from '@heroui/react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  CURRENT_EMPLOYEE_ID,
  CURRENT_MANAGER_ID,
  fullName,
  getUser,
} from '@/data/mock';
import { useLogout } from '@/features/auth/hooks/useLogout';
import type { Role } from '@/features/users/types';
import { RoleChip } from '@/shared/ui/StatusChips';
import { Brand } from './Brand';
import { appPath, navSections } from './nav';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const logout = useLogout();
  const [role, setRole] = useState<Role>('manager');
  const currentUser = getUser(
    role === 'manager' ? CURRENT_MANAGER_ID : CURRENT_EMPLOYEE_ID
  )!;

  const handleAction = (key: string | number) => {
    if (key === 'profile') {
      navigate(appPath('/profile'));
      onNavigate?.();
    } else if (key === 'switch-role') {
      const next = role === 'manager' ? 'employee' : 'manager';
      setRole(next);
      navigate(appPath());
      onNavigate?.();
      toast.info(
        `Aperçu en tant que ${next === 'manager' ? 'manager' : 'employé'}`,
        {
          description: 'Mode démo : la navigation s’adapte au rôle.',
        }
      );
    } else if (key === 'logout') {
      logout();
      onNavigate?.();
    }
  };

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='px-5 pt-5 pb-4'>
        <Brand />
      </div>

      <nav
        aria-label='Navigation principale'
        className='flex-1 overflow-y-auto px-3 pb-4'
      >
        {navSections.map((section) => {
          const items = section.items.filter((item) =>
            item.roles.includes(role)
          );
          if (items.length === 0) return null;
          return (
            <div className='mb-5' key={section.title}>
              <p className='px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted uppercase'>
                {section.title}
              </p>
              <ul className='flex flex-col gap-1'>
                {items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors',
                          'focus-visible:ring-2 focus-visible:ring-focus',
                          isActive
                            ? 'bg-accent-soft text-accent-soft-foreground'
                            : 'text-muted hover:bg-default hover:text-foreground'
                        )
                      }
                      end={end}
                      to={to}
                      onClick={onNavigate}
                    >
                      <Icon className='size-[18px] shrink-0' />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className='px-3 pb-3'>
        <div className='mb-3 rounded-lg bg-accent-soft p-3.5'>
          <div className='flex items-center gap-2 text-accent-soft-foreground'>
            <Shield className='size-4' />
            <p className='text-xs font-semibold'>Conforme RGPD</p>
          </div>
          <p className='mt-1 text-xs leading-relaxed text-muted'>
            Vos données de pointage sont chiffrées et accessibles selon votre
            rôle.
          </p>
        </div>

        <Separator className='mb-3' />

        <Dropdown>
          <Button
            aria-label='Menu du compte'
            className='h-auto w-full justify-start gap-3 rounded-lg px-2 py-2 text-left'
            variant='ghost'
          >
            <Avatar size='sm'>
              <Avatar.Image
                alt='Blue'
                src='https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg'
              />
            </Avatar>
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-medium text-foreground'>
                {fullName(currentUser)}
              </span>
              <span className='block truncate text-xs font-normal text-muted'>
                {role === 'manager' ? 'Manager' : 'Employé'}
              </span>
            </span>
            <ChevronsExpandHorizontal className='size-4 shrink-0 rotate-90 text-muted' />
          </Button>
          <Dropdown.Popover className='min-w-[280px]'>
            <div className='flex items-center justify-between gap-2 px-3 pt-3 pb-2'>
              <p className='truncate text-xs text-muted'>{currentUser.email}</p>
              <RoleChip role={role} />
            </div>
            <Dropdown.Menu onAction={handleAction}>
              <Dropdown.Item id='profile' textValue='Mon compte'>
                <Gear className='size-4 shrink-0 text-muted' />
                <Label className='flex-1'>Mon compte</Label>
                <Kbd variant='light'>
                  <Kbd.Content>G</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
              <Dropdown.Item id='switch-role' textValue='Changer de rôle'>
                <PersonWorker className='size-4 shrink-0 text-muted' />
                <Label className='flex-1'>
                  {role === 'manager'
                    ? 'Voir en tant qu’employé'
                    : 'Voir en tant que manager'}
                </Label>
                <Kbd variant='light'>
                  <Kbd.Abbr keyValue='shift' />
                  <Kbd.Content>R</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
              <Dropdown.Item
                id='logout'
                textValue='Se déconnecter'
                variant='danger'
              >
                <ArrowRightFromSquare className='size-4 shrink-0 text-danger' />
                <Label className='flex-1'>Se déconnecter</Label>
                <Kbd variant='light'>
                  <Kbd.Abbr keyValue='shift' />
                  <Kbd.Content>Q</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </div>
  );
}
