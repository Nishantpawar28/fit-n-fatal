'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { GlobalSearch } from './global-search';
import { MobileMenu } from './mobile-menu';

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 bg-fnf-bg/85 backdrop-blur-md border-b border-purple-500/10">
      <div className="flex items-center gap-3 px-4 md:px-8 py-3">
        <MobileMenu />
        <span className="md:hidden font-heading font-bold text-fnf-text">
          Fit N <span className="text-fnf-violet">Fatal</span>
        </span>
        <div className="hidden md:block flex-1">
          <GlobalSearch />
        </div>
        <div className="ml-auto md:ml-0 flex items-center gap-3">
          <Link href="/dashboard/settings" className="hidden md:flex text-fnf-muted hover:text-fnf-text">
            <Settings size={18} />
          </Link>
        </div>
      </div>
      <div className="md:hidden px-4 pb-3">
        <GlobalSearch />
      </div>
    </header>
  );
}
