'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Card } from '@/components/ui';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setIsError(true);
      if (error.message.includes('Database error saving new user')) {
        setMessage(
          'Signup failed in Supabase. Run supabase/fix-auth.sql in your Supabase SQL Editor, then try again.'
        );
      } else {
        setMessage(error.message);
      }
      return;
    }

    if (data.session) {
      router.push('/dashboard');
      router.refresh();
      return;
    }

    setMessage('Account created. Check your email to confirm, then sign in.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold text-fnf-text mb-8">
          Join <span className="text-fnf-violet">Fatal</span>
        </h1>
        <Card>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input value={email} onChange={setEmail} placeholder="Email" type="email" />
            <Input value={password} onChange={setPassword} placeholder="Password (min 6 chars)" type="password" />
            {message && (
              <p className={`text-sm ${isError ? 'text-red-400' : 'text-fnf-violet'}`}>{message}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-fnf-muted text-sm mt-4">
            Have an account?{' '}
            <Link href="/login" className="text-fnf-violet hover:underline">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
