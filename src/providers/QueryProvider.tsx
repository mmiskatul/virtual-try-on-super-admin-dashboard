'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { platformActions } from '../store/slices/platformSlice';
import { readPersistedPlatformState } from '../store/middleware/persistence';

function ReduxPlatformHydrator() {
  useEffect(() => {
    store.dispatch(platformActions.hydratePlatform(readPersistedPlatformState()));
  }, []);

  return null;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  return (
    <Provider store={store}>
      <ReduxPlatformHydrator />
      <SessionProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SessionProvider>
    </Provider>
  );
}
