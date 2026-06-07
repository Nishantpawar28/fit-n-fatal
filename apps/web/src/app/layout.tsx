import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['600', '700'] });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: 'Fit N Fatal',
  description: 'Dark · Purple · Deadly — Fitness tracking app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-body min-h-screen bg-fnf-bg antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
