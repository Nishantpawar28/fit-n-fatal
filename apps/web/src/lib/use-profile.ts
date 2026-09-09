'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getProfile } from '@fit-n-fatal/db';
import { useCurrentUserId } from './use-current-user';
import { applyTheme } from './theme';

export function useProfile() {
  const { userId, ready } = useCurrentUserId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (query.data?.theme_preference) {
      applyTheme(query.data.theme_preference);
    }
  }, [query.data?.theme_preference]);

  return {
    userId,
    ready,
    profile: query.data ?? null,
    isLoading: query.isLoading,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  };
}
