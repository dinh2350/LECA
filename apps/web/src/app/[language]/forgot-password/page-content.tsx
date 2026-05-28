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
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 mb-4">
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
                {t('forgot-password:title')}
              </h2>
            </div>
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
    </FormProvider>
  );
}

function ForgotPassword() {
  return <Form />;
}

export default withPageRequiredGuest(ForgotPassword);
