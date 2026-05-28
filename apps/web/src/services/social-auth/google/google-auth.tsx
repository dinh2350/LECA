'use client';

import { useAuthGoogleLoginService } from '@/services/api/services/auth';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { FullPageLoader } from '@/components/full-page-loader';
import { useSocialLogin } from '@/services/social-auth/use-social-login';

export default function GoogleAuth() {
  const authGoogleLoginService = useAuthGoogleLoginService();
  const { login, isLoading } = useSocialLogin(authGoogleLoginService);

  const onSuccess = async (tokenResponse: CredentialResponse) => {
    if (!tokenResponse.credential) return;
    await login({ idToken: tokenResponse.credential });
  };

  return (
    <>
      <GoogleLogin onSuccess={onSuccess} />
      <FullPageLoader isLoading={isLoading} />
    </>
  );
}
