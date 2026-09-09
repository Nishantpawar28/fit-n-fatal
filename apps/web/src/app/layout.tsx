import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { THEME_INIT_SCRIPT } from '@/lib/theme';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['600', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: 'FitNFatal',
  description: 'Track. Train. Transform. — your personal fitness command center.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-body min-h-screen bg-fnf-bg antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
