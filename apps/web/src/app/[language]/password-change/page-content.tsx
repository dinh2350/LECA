'use client';

import withPageRequiredGuest from '@/services/auth/with-page-required-guest';
import { useForm, FormProvider, useFormState } from 'react-hook-form';
import { useAuthResetPasswordService } from '@/services/api/services/auth';
import FormTextInput from '@/components/form/text-input/form-text-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from '@/hooks/use-snackbar';
import { useRouter } from 'next/navigation';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useTranslation } from '@/services/i18n/client';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type PasswordChangeFormData = {
  password: string;
  passwordConfirmation: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation('password-change');

  return z
    .object({
      password: z
        .string()
        .min(6, t('password-change:inputs.password.validation.min')),
      passwordConfirmation: z
        .string()
        .min(
          1,
          t('password-change:inputs.passwordConfirmation.validation.required'),
        ),
    })
    .refine((data) => data.passwordConfirmation === data.password, {
      message: t(
        'password-change:inputs.passwordConfirmation.validation.match',
      ),
      path: ['passwordConfirmation'],
    });
};

function FormActions() {
  const { t } = useTranslation('password-change');
  const { isSubmitting } = useFormState();

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="set-password">
      {t('password-change:actions.submit')}
    </Button>
  );
}

function ExpiresAlert() {
  const { t } = useTranslation('password-change');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const expires = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return Number(params.get('expires'));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      if (expires < now) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expires]);

  const isExpired = expires < currentTime;

  return isExpired ? (
    <div
      className="rounded-md border border-[var(--color-warn)] bg-[var(--color-warn)]/10 text-[var(--color-warn)] px-4 py-3 text-sm"
      data-testid="reset-link-expired-alert"
    >
      {t('password-change:alerts.expired')}
    </div>
  ) : null;
}

function Form() {
  const { enqueueSnackbar } = useSnackbar();
  const fetchAuthResetPassword = useAuthResetPasswordService();
  const { t } = useTranslation('password-change');
  const validationSchema = useValidationSchema();
  const router = useRouter();

  const methods = useForm<PasswordChangeFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      password: '',
      passwordConfirmation: '',
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    if (!hash) return;

    const { data, status } = await fetchAuthResetPassword({
      password: formData.password,
      hash,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof PasswordChangeFormData>).forEach(
        (key) => {
          setError(key, {
            type: 'manual',
            message: t(
              `password-change:inputs.${key}.validation.server.${data.errors[key]}`,
            ),
          });
        },
      );

      return;
    }

    if (status === HTTP_CODES_ENUM.NO_CONTENT) {
      enqueueSnackbar(t('password-change:alerts.success'), {
        variant: 'success',
      });

      router.replace('/sign-in');
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 mb-4">
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {t('password-change:title')}
              </h2>
            </div>
            <ExpiresAlert />
            <FormTextInput<PasswordChangeFormData>
              name="password"
              label={t('password-change:inputs.password.label')}
              type="password"
              testId="password"
            />
            <FormTextInput<PasswordChangeFormData>
              name="passwordConfirmation"
              label={t('password-change:inputs.passwordConfirmation.label')}
              type="password"
              testId="password-confirmation"
            />
            <div>
              <FormActions />
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function PasswordChange() {
  return <Form />;
}

export default withPageRequiredGuest(PasswordChange);
