'use client';

import { useAuthFacebookLoginService } from '@/services/api/services/auth';
import { FullPageLoader } from '@/components/full-page-loader';
import useFacebookAuth from './use-facebook-auth';
import { useTranslation } from '@/services/i18n/client';
import { useSocialLogin } from '@/services/social-auth/use-social-login';
import { Button } from '@/components/ui/button';

export default function FacebookAuth() {
  const authFacebookLoginService = useAuthFacebookLoginService();
  const { login, isLoading } = useSocialLogin(authFacebookLoginService);
  const facebook = useFacebookAuth();
  const { t } = useTranslation('common');

  const onLogin = async () => {
    const loginResponse = await facebook.login();
    if (!loginResponse.authResponse) return;
    await login({ accessToken: loginResponse.authResponse.accessToken });
  };

  return (
    <>
      <Button onClick={onLogin}>{t('common:auth.facebook.action')}</Button>
      <FullPageLoader isLoading={isLoading} />
    </>
  );
}
