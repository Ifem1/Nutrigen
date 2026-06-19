'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient per component mount so SSR instances don't share cache
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,       // 1 min — fresh enough for most data
            gcTime: 5 * 60 * 1000,      // 5 min — keep in cache while navigating
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
