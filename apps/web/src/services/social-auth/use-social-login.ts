'use client';

import { useState } from 'react';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import useAuthActions from '@/services/auth/use-auth-actions';
import useAuthTokens from '@/services/auth/use-auth-tokens';
import { AuthLoginResponse } from '@/services/api/services/auth';
import { FetchJsonResponse } from '@/services/api/types/fetch-json-response';

export function useSocialLogin<T>(
  loginFn: (params: T) => Promise<FetchJsonResponse<AuthLoginResponse>>,
) {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (params: T) => {
    setIsLoading(true);
    try {
      const response = await loginFn(params);
      if (response.status === HTTP_CODES_ENUM.OK) {
        setTokensInfo({
          token: response.data.token,
          refreshToken: response.data.refreshToken,
          tokenExpires: response.data.tokenExpires,
        });
        setUser(response.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
}
