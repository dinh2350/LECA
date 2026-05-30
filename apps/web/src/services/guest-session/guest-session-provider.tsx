'use client';

import { PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { GuestSessionContext } from './guest-session-context';

const CONVERSATIONS_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? '') + '/v1/conversations';

export default function GuestSessionProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startGuestSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(CONVERSATIONS_URL, {
        method: 'POST',
        credentials: 'include', // sends the device-id cookie
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 403) {
        const body = await res.json();
        if (body?.code === 'GUEST_LIMIT_REACHED') {
          setLimitReached(true);
          return;
        }
      }

      if (!res.ok) throw new Error('Failed to start guest session');

      const data = await res.json();
      setToken(data.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ token, limitReached, isLoading, startGuestSession }),
    [token, limitReached, isLoading, startGuestSession],
  );

  return (
    <GuestSessionContext.Provider value={value}>
      {children}
    </GuestSessionContext.Provider>
  );
}
