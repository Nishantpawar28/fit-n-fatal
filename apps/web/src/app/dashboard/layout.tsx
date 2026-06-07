import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';
import { devSkipAuth } from '@/lib/dev';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!devSkipAuth) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        {devSkipAuth && (
          <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Dev mode: auth skipped. Browse the UI and exercise library. Workouts and history need a logged-in user.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
