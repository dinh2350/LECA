'use client';

import withPageRequiredGuest from '@/services/auth/with-page-required-guest';
import { useForm, FormProvider, useFormState } from 'react-hook-form';
import {
  useAuthLoginService,
  useAuthSignUpService,
} from '@/services/api/services/auth';
import useAuthActions from '@/services/auth/use-auth-actions';
import useAuthTokens from '@/services/auth/use-auth-tokens';
import FormTextInput from '@/components/form/text-input/form-text-input';
import FormCheckboxInput from '@/components/form/checkbox/form-checkbox';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from '@/components/link';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useTranslation } from '@/services/i18n/client';
import SocialAuth from '@/services/social-auth/social-auth';
import { isGoogleAuthEnabled } from '@/services/social-auth/google/google-config';
import { isFacebookAuthEnabled } from '@/services/social-auth/facebook/facebook-config';
import { Button } from '@/components/ui/button';

type SignUpFormData = z.infer<ReturnType<typeof useValidationSchema>>;

const useValidationSchema = () => {
  const { t } = useTranslation('sign-up');
  return z.object({
    firstName: z
      .string()
      .min(1, t('sign-up:inputs.firstName.validation.required')),
    lastName: z
      .string()
      .min(1, t('sign-up:inputs.lastName.validation.required')),
    email: z.string().email(t('sign-up:inputs.email.validation.invalid')),
    password: z.string().min(6, t('sign-up:inputs.password.validation.min')),
    policy: z
      .array(z.object({ id: z.string(), name: z.string() }))
      .min(1, t('sign-up:inputs.policy.validation.required')),
  });
};

function FormActions() {
  const { t } = useTranslation('sign-up');
  const { isSubmitting } = useFormState();

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="sign-up-submit">
      {t('sign-up:actions.submit')}
    </Button>
  );
}

function Form() {
  const { setUser } = useAuthActions();
  const { setTokensInfo } = useAuthTokens();
  const fetchAuthLogin = useAuthLoginService();
  const fetchAuthSignUp = useAuthSignUpService();
  const { t } = useTranslation('sign-up');
  const validationSchema = useValidationSchema();
  const policyOptions = [
    { id: 'policy', name: t('sign-up:inputs.policy.agreement') },
  ];

  const methods = useForm<SignUpFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      policy: [],
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data: dataSignUp, status: statusSignUp } =
      await fetchAuthSignUp(formData);

    if (statusSignUp === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(dataSignUp.errors) as Array<keyof SignUpFormData>).forEach(
        (key) => {
          setError(key, {
            type: 'manual',
            message: t(
              `sign-up:inputs.${key}.validation.server.${dataSignUp.errors[key]}`,
            ),
          });
        },
      );

      return;
    }

    const { data: dataSignIn, status: statusSignIn } = await fetchAuthLogin({
      email: formData.email,
      password: formData.password,
    });

    if (statusSignIn === HTTP_CODES_ENUM.OK) {
      setTokensInfo({
        token: dataSignIn.token,
        refreshToken: dataSignIn.refreshToken,
        tokenExpires: dataSignIn.tokenExpires,
      });
      setUser(dataSignIn.user);
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
              {t('sign-up:title')}
            </h1>
          </div>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-4">
              <FormTextInput<SignUpFormData>
                name="firstName"
                label={t('sign-up:inputs.firstName.label')}
                type="text"
                autoFocus
                testId="first-name"
              />
              <FormTextInput<SignUpFormData>
                name="lastName"
                label={t('sign-up:inputs.lastName.label')}
                type="text"
                testId="last-name"
              />
              <FormTextInput<SignUpFormData>
                name="email"
                label={t('sign-up:inputs.email.label')}
                type="email"
                testId="email"
              />
              <FormTextInput<SignUpFormData>
                name="password"
                label={t('sign-up:inputs.password.label')}
                type="password"
                testId="password"
              />
              <FormCheckboxInput
                name="policy"
                label=""
                testId="privacy"
                options={policyOptions}
                keyValue="id"
                keyExtractor={(option) => option.id.toString()}
                renderOption={(option) => (
                  <span>
                    {option.name}
                    <a
                      href="/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-accent)] hover:underline ml-1"
                    >
                      {t('sign-up:inputs.policy.label')}
                    </a>
                  </span>
                )}
              />
              <div className="flex items-center gap-2">
                <FormActions />
                <Button variant="outline" asChild data-testid="login">
                  <Link href="/sign-in">
                    {t('sign-up:actions.accountAlreadyExists')}
                  </Link>
                </Button>
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
                      {t('sign-up:or')}
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

function SignUp() {
  return <Form />;
}

export default withPageRequiredGuest(SignUp);
