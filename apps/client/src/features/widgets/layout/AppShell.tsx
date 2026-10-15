import { Drawer } from '@heroui/react';
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div
      className='min-h-svh bg-background text-foreground'
      id='tm-export-root'
    >
      <a
        className='sr-only z-50 rounded-lg bg-accent px-3 py-2 text-accent-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3'
        href='#contenu'
      >
        Aller au contenu
      </a>

      <aside className='fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-separator bg-background lg:block'>
        <Sidebar />
      </aside>

      <Drawer.Backdrop
        isOpen={menuOpen}
        variant='blur'
        onOpenChange={setMenuOpen}
      >
        <Drawer.Content placement='left'>
          <Drawer.Dialog
            aria-label='Menu de navigation'
            className='w-72 max-w-[85vw] bg-background p-0'
          >
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <div className='lg:pl-64'>
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main
          className='mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 3xl:max-w-[1480px] 3xl:px-10 3xl:py-9 4xl:max-w-[1680px] 4xl:px-12 4xl:py-10'
          id='contenu'
        >
          <div
            className='tm-page flex flex-col gap-6 3xl:gap-7 4xl:gap-8'
            key={pathname}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
