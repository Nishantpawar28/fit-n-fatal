'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PRIMARY_LINKS } from './nav-links';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-fnf-surface/95 backdrop-blur-md border-t border-purple-500/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around">
        {PRIMARY_LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2.5 flex-1 text-[11px] transition-colors',
                active ? 'text-fnf-violet' : 'text-fnf-muted'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
