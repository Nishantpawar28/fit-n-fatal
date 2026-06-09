'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (!data.session) {
      setError('Could not create a session. Please try again.');
      setLoading(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Enter your email above, then click Forgot password.');
      return;
    }
    setResetting(true);
    setError('');
    setInfo('');
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo('If this email exists, a password reset link was sent.');
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold text-fnf-text mb-1">
          Fit N <span className="text-fnf-violet">Fatal</span>
        </h1>
        <p className="text-fnf-muted text-sm mb-8">Train hard. Track harder.</p>

        <div className="bg-gradient-to-r from-[#6B1FCC] to-[#A83BEE] rounded-xl p-5 mb-6">
          <p className="font-heading font-semibold text-white">Dark · Purple · Deadly</p>
          <p className="text-white/65 text-xs mt-1">Your strength journey starts here</p>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-fnf-secondary text-xs mb-1.5 block">Email</label>
              <Input value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
            </div>
            <div>
              <label className="text-fnf-secondary text-xs mb-1.5 block">Password</label>
              <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {info && <p className="text-fnf-violet text-sm">{info}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetting}
              className="w-full text-center text-fnf-muted text-sm hover:text-fnf-violet"
            >
              {resetting ? 'Sending reset link...' : 'Forgot password?'}
            </button>
          </form>
          <Button onClick={handleGoogle} variant="secondary" className="w-full mt-3">
            Continue with Google
          </Button>
          <p className="text-center text-fnf-muted text-sm mt-4">
            No account?{' '}
            <Link href="/signup" className="text-fnf-violet hover:underline">Sign up</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
