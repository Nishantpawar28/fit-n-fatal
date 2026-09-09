import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { BottomNav } from '@/components/bottom-nav';
import { WaterReminder } from '@/components/water-reminder';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (profile && !profile.onboarding_completed) redirect('/onboarding');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-8 overflow-auto pb-24 md:pb-8">{children}</main>
        <BottomNav />
      </div>
      <WaterReminder />
    </div>
  );
}
