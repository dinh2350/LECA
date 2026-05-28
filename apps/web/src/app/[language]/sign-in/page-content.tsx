'use client';

import withPageRequiredGuest from '@/services/auth/with-page-required-guest';
import { useForm, FormProvider, useFormState } from 'react-hook-form';
import { useAuthLoginService } from '@/services/api/services/auth';
import useAuthActions from '@/services/auth/use-auth-actions';
import useAuthTokens from '@/services/auth/use-auth-tokens';
import FormTextInput from '@/components/form/text-input/form-text-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from '@/components/link';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useTranslation } from '@/services/i18n/client';
import SocialAuth from '@/services/social-auth/social-auth';
import { isGoogleAuthEnabled } from '@/services/social-auth/google/google-config';
import { isFacebookAuthEnabled } from '@/services/social-auth/facebook/facebook-config';
import { IS_SIGN_UP_ENABLED } from '@/services/auth/config';
import { Button } from '@/components/ui/button';

type SignInFormData = z.infer<ReturnType<typeof useValidationSchema>>;

const useValidationSchema = () => {
  const { t } = useTranslation('sign-in');

  return z.object({
    email: z.string().email(t('sign-in:inputs.email.validation.invalid')),
    password: z.string().min(6, t('sign-in:inputs.password.validation.min')),
  });
};

function FormActions() {
  const { t } = useTranslation('sign-in');
  const { isSubmitting } = useFormState();

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="sign-in-submit">
      {t('sign-in:actions.submit')}
    </Button>
  );
}

function Form() {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLogin = useAuthLoginService();
  const { t } = useTranslation('sign-in');
  const validationSchema = useValidationSchema();

  const methods = useForm<SignInFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthLogin(formData);

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof SignInFormData>).forEach(
        (key) => {
          setError(key, {
            type: 'manual',
            message: t(
              `sign-in:inputs.${key}.validation.server.${data.errors[key]}`,
            ),
          });
        },
      );

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      setTokensInfo({
        token: data.token,
        refreshToken: data.refreshToken,
        tokenExpires: data.tokenExpires,
      });
      setUser(data.user);
    }
  });

  return (
    <FormProvider {...methods}>
      <div
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--s1)',
            border: '1px solid var(--border-h)',
            borderRadius: 'var(--r-lg)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            padding: '40px 36px',
          }}
        >
          <div style={{ marginBottom: '32px' }}>
            <div
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--cream)',
                marginBottom: '4px',
              }}
            >
              L<span style={{ color: 'var(--amber)' }}>E</span>CA
            </div>
            <h1
              style={{
                fontFamily: 'var(--fd)',
                fontSize: '28px',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--cream)',
                margin: 0,
              }}
            >
              {t('sign-in:title')}
            </h1>
          </div>

          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-4">
              <FormTextInput<SignInFormData>
                name="email"
                label={t('sign-in:inputs.email.label')}
                type="email"
                testId="email"
                autoFocus
              />
              <FormTextInput<SignInFormData>
                name="password"
                label={t('sign-in:inputs.password.label')}
                type="password"
                testId="password"
              />
              <div>
                <Link
                  href="/forgot-password"
                  data-testid="forgot-password"
                  className="leca-nav-link"
                >
                  {t('sign-in:actions.forgotPassword')}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <FormActions />
                {IS_SIGN_UP_ENABLED && (
                  <Button
                    variant="outline"
                    asChild
                    data-testid="create-account"
                  >
                    <Link href="/sign-up">
                      {t('sign-in:actions.createAccount')}
                    </Link>
                  </Button>
                )}
              </div>
              {[isGoogleAuthEnabled, isFacebookAuthEnabled].some(Boolean) && (
                <div>
                  <div className="relative flex items-center my-4">
                    <div className="flex-grow border-t border-[var(--leca-border)]" />
                    <span
                      className="mx-3"
                      style={{
                        fontFamily: 'var(--fm)',
                        fontSize: '11px',
                        color: 'var(--cream-m)',
                      }}
                    >
                      {t('sign-in:or')}
                    </span>
                    <div className="flex-grow border-t border-[var(--leca-border)]" />
                  </div>
                  <SocialAuth />
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}

function SignIn() {
  return <Form />;
}

export default withPageRequiredGuest(SignIn);
