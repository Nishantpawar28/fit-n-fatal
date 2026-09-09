'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SECONDARY_LINKS } from './nav-links';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button onClick={() => setOpen(true)} className="md:hidden text-fnf-text p-1.5 -ml-1.5" aria-label="Open menu">
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="fnf-animate-in absolute left-0 top-0 bottom-0 w-72 bg-fnf-surface border-r border-purple-500/10 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="font-heading text-lg font-bold text-fnf-text">
                Fit N <span className="text-fnf-violet">Fatal</span>
              </span>
              <button onClick={() => setOpen(false)} className="text-fnf-muted hover:text-fnf-text">
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-1">
              {SECONDARY_LINKS.map((link) => {
                const active = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      active ? 'bg-purple-500/20 text-fnf-violet' : 'text-fnf-muted hover:text-fnf-text hover:bg-white/5'
                    )}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <form action="/auth/signout" method="post" className="mt-6 pt-4 border-t border-white/5">
              <button type="submit" className="flex items-center gap-2 text-fnf-muted text-sm hover:text-fnf-text px-3 py-2">
                <LogOut size={14} /> Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
