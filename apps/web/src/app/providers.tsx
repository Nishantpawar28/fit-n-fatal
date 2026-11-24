'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/components/toast-provider';
import { ServiceWorkerRegister } from '@/components/sw-register';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays "fresh" for a minute: navigating between screens reuses
        // what's already loaded instead of re-downloading it.
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        // On a phone you leave and come back to the app constantly (music,
        // timer, messages). Refetching everything on each return is what made
        // buttons feel late. Mutations already refresh what they change.
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
      <ServiceWorkerRegister />
    </QueryClientProvider>
  );
}
