'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/workout', label: 'Workout' },
  { href: '/dashboard/history', label: 'History' },
  { href: '/dashboard/progress', label: 'Progress' },
  { href: '/dashboard/exercises', label: 'Exercises' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-fnf-surface border-r border-purple-500/10 p-4 flex flex-col min-h-screen">
      <h1 className="font-heading text-lg font-bold text-fnf-text mb-8">
        Fit N <span className="text-fnf-violet">Fatal</span>
      </h1>
      <nav className="space-y-1 flex-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'block px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === link.href
                ? 'bg-purple-500/20 text-fnf-violet'
                : 'text-fnf-muted hover:text-fnf-text hover:bg-white/5'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <form action="/auth/signout" method="post">
        <button type="submit" className="text-fnf-muted text-xs hover:text-fnf-text">
          Sign out
        </button>
      </form>
    </aside>
  );
}
