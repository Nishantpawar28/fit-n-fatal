'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_LINKS } from './nav-links';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 bg-fnf-surface border-r border-purple-500/10 p-4 flex-col min-h-screen sticky top-0">
      <Link href="/dashboard" className="font-heading text-lg font-bold text-fnf-text mb-1 block">
        Fit N <span className="text-fnf-violet">Fatal</span>
      </Link>
      <p className="text-fnf-muted text-[11px] mb-8 tracking-wide">Track. Train. Transform.</p>
      <nav className="space-y-1 flex-1 overflow-y-auto">
        {ALL_LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-purple-500/20 text-fnf-violet' : 'text-fnf-muted hover:text-fnf-text hover:bg-white/5'
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action="/auth/signout" method="post">
        <button type="submit" className="flex items-center gap-2 text-fnf-muted text-xs hover:text-fnf-text px-3 py-2">
          <LogOut size={14} /> Sign out
        </button>
      </form>
    </aside>
  );
}
