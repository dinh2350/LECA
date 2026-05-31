'use client';

import { useContext } from 'react';
import { GuestSessionContext } from './guest-session-context';

export function useGuestSession() {
  return useContext(GuestSessionContext);
}
