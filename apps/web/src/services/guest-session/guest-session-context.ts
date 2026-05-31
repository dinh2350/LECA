'use client';

import { createContext } from 'react';

export type GuestSessionState = {
  token: string | null;
  limitReached: boolean;
  isLoading: boolean;
  startGuestSession: () => Promise<void>;
};

export const GuestSessionContext = createContext<GuestSessionState>({
  token: null,
  limitReached: false,
  isLoading: false,
  startGuestSession: async () => {},
});
