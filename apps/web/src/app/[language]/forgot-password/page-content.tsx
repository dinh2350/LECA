'use client';

import withPageRequiredGuest from '@/services/auth/with-page-required-guest';
import { useForm, FormProvider, useFormState } from 'react-hook-form';
import { useAuthForgotPasswordService } from '@/services/api/services/auth';
import FormTextInput from '@/components/form/text-input/form-text-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackbar } from '@/hooks/use-snackbar';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useTranslation } from '@/services/i18n/client';
import { Button } from '@/components/ui/button';

type ForgotPasswordFormData = {
  email: string;
};

const useValidationSchema = () => {
  const { t } = useTranslation('forgot-password');

  return z.object({
    email: z
      .string()
      .email(t('forgot-password:inputs.email.validation.invalid'))
      .min(1, t('forgot-password:inputs.email.validation.required')),
  });
};

function FormActions() {
  const { t } = useTranslation('forgot-password');
  const { isSubmitting } = useFormState();

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="send-email">
      {t('forgot-password:actions.submit')}
    </Button>
  );
}

function Form() {
  const { enqueueSnackbar } = useSnackbar();
  const fetchAuthForgotPassword = useAuthForgotPasswordService();
  const { t } = useTranslation('forgot-password');
  const validationSchema = useValidationSchema();

  const methods = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      email: '',
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthForgotPassword(formData);

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof ForgotPasswordFormData>).forEach(
        (key) => {
          setError(key, {
            type: 'manual',
            message: t(
              `forgot-password:inputs.${key}.validation.server.${data.errors[key]}`,
            ),
          });
        },
      );

      return;
    }

    if (status === HTTP_CODES_ENUM.NO_CONTENT) {
      enqueueSnackbar(t('forgot-password:alerts.success'), {
        variant: 'success',
      });
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
              {t('forgot-password:title')}
            </h1>
          </div>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-4">
              <FormTextInput<ForgotPasswordFormData>
                name="email"
                label={t('forgot-password:inputs.email.label')}
                type="email"
                testId="email"
              />
              <div>
                <FormActions />
              </div>
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  );
}

function ForgotPassword() {
  return <Form />;
}

export default withPageRequiredGuest(ForgotPassword);
