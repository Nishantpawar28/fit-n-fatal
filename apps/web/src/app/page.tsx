import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { devSkipAuth } from '@/lib/dev';

export default async function Home() {
  if (devSkipAuth) redirect('/dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  redirect(user ? '/dashboard' : '/login');
}
