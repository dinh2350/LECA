'use client';

import { useState } from 'react';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import useAuthActions from '@/services/auth/use-auth-actions';
import useAuthTokens from '@/services/auth/use-auth-tokens';
import { AuthLoginResponse } from '@/services/api/services/auth';

export function useSocialLogin<T>(
  loginFn: (params: T) => Promise<{ status: number; data: AuthLoginResponse }>,
) {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (params: T) => {
    setIsLoading(true);
    try {
      const { status, data } = await loginFn(params);
      if (status === HTTP_CODES_ENUM.OK) {
        setTokensInfo({
          token: data.token,
          refreshToken: data.refreshToken,
          tokenExpires: data.tokenExpires,
        });
        setUser(data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
