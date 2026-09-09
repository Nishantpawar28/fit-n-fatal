import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) redirect('/dashboard');

  return <OnboardingForm userId={user.id} defaultName={profile?.display_name ?? ''} />;
}
