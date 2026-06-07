'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setUserId(data.user?.id ?? null);
        setReady(true);
      });
  }, []);

  return { userId, ready };
}
