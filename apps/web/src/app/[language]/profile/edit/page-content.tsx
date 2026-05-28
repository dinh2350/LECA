'use client';

import { useForm, FormProvider, useFormState } from 'react-hook-form';
import { useAuthPatchMeService } from '@/services/api/services/auth';
import useAuthActions from '@/services/auth/use-auth-actions';
import FormTextInput from '@/components/form/text-input/form-text-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useEffect } from 'react';
import useAuth from '@/services/auth/use-auth';
import { useSnackbar } from '@/hooks/use-snackbar';
import Link from '@/components/link';
import FormAvatarInput from '@/components/form/avatar-input/form-avatar-input';
import { FileEntity } from '@/services/api/types/file-entity';
import useLeavePage from '@/services/leave-page/use-leave-page';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useTranslation } from '@/services/i18n/client';
import { UserProviderEnum } from '@/services/api/types/user';
import { Button } from '@/components/ui/button';

type EditProfileBasicInfoFormData = {
  firstName: string;
  lastName: string;
  photo?: FileEntity;
};

type EditProfileChangePasswordFormData = {
  oldPassword: string;
  password: string;
  passwordConfirmation: string;
};

type EditProfileChangeEmailFormData = {
  email: string;
  emailConfirmation: string;
};

const useValidationBasicInfoSchema = () => {
  const { t } = useTranslation('profile');

  return z.object({
    firstName: z
      .string()
      .min(1, t('profile:inputs.firstName.validation.required')),
    lastName: z
      .string()
      .min(1, t('profile:inputs.lastName.validation.required')),
    photo: z.object({ id: z.string(), path: z.string() }).optional().nullable(),
  });
};

const useValidationChangeEmailSchema = () => {
  const { t } = useTranslation('profile');
  const { user } = useAuth();

  return z
    .object({
      email: z
        .string()
        .email(t('profile:inputs.email.validation.email'))
        .min(1, t('profile:inputs.email.validation.required'))
        .refine(
          (email) => email !== user?.email,
          t('profile:inputs.email.validation.currentEmail'),
        ),
      emailConfirmation: z
        .string()
        .min(1, t('profile:inputs.emailConfirmation.validation.required')),
    })
    .refine((data) => data.emailConfirmation === data.email, {
      message: t('profile:inputs.emailConfirmation.validation.match'),
      path: ['emailConfirmation'],
    });
};

const useValidationChangePasswordSchema = () => {
  const { t } = useTranslation('profile');

  return z
    .object({
      oldPassword: z
        .string()
        .min(6, t('profile:inputs.password.validation.min')),
      password: z.string().min(6, t('profile:inputs.password.validation.min')),
      passwordConfirmation: z
        .string()
        .min(1, t('profile:inputs.passwordConfirmation.validation.required')),
    })
    .refine((data) => data.passwordConfirmation === data.password, {
      message: t('profile:inputs.passwordConfirmation.validation.match'),
      path: ['passwordConfirmation'],
    });
};

function BasicInfoFormActions() {
  const { t } = useTranslation('profile');
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-profile">
      {t('profile:actions.submit')}
    </Button>
  );
}

function ChangeEmailFormActions() {
  const { t } = useTranslation('profile');
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-email">
      {t('profile:actions.submit')}
    </Button>
  );
}

function ChangePasswordFormActions() {
  const { t } = useTranslation('profile');
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-password">
      {t('profile:actions.submit')}
    </Button>
  );
}

function FormBasicInfo() {
  const { setUser } = useAuthActions();
  const { user } = useAuth();
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation('profile');
  const validationSchema = useValidationBasicInfoSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileBasicInfoFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      firstName: '',
      lastName: '',
      photo: undefined,
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe(formData);

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<keyof EditProfileBasicInfoFormData>
      ).forEach((key) => {
        setError(key, {
          type: 'manual',
          message: t(
            `profile:inputs.${key}.validation.server.${data.errors[key]}`,
          ),
        });
      });

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      setUser(data);

      enqueueSnackbar(t('profile:alerts.profile.success'), {
        variant: 'success',
      });
    }
  });

  useEffect(() => {
    reset({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      photo: user?.photo,
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 mb-6 mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t('profile:title1')}
            </h2>
            <FormAvatarInput<EditProfileBasicInfoFormData>
              name="photo"
              testId="photo"
            />
            <FormTextInput<EditProfileBasicInfoFormData>
              name="firstName"
              label={t('profile:inputs.firstName.label')}
              testId="first-name"
            />
            <FormTextInput<EditProfileBasicInfoFormData>
              name="lastName"
              label={t('profile:inputs.lastName.label')}
              testId="last-name"
            />
            <div className="flex items-center gap-2">
              <BasicInfoFormActions />
              <Button
                variant="outline"
                asChild
                data-testid="cancel-edit-profile"
              >
                <Link href="/profile">{t('profile:actions.cancel')}</Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function FormChangeEmail() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation('profile');
  const validationSchema = useValidationChangeEmailSchema();
  const { user } = useAuth();

  const methods = useForm<EditProfileChangeEmailFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      email: '',
      emailConfirmation: '',
    },
  });

  const { handleSubmit, reset, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({
      email: formData.email,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<keyof EditProfileChangeEmailFormData>
      ).forEach((key) => {
        setError(key, {
          type: 'manual',
          message: t(
            `profile:inputs.${key}.validation.server.${data.errors[key]}`,
          ),
        });
      });

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      reset();

      enqueueSnackbar(t('profile:alerts.email.success'), {
        variant: 'success',
        autoHideDuration: 15000,
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t('profile:title2')}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">{user?.email}</p>
            <FormTextInput<EditProfileChangeEmailFormData>
              name="email"
              label={t('profile:inputs.email.label')}
              type="email"
              testId="email"
            />
            <FormTextInput<EditProfileChangeEmailFormData>
              name="emailConfirmation"
              label={t('profile:inputs.emailConfirmation.label')}
              type="email"
              testId="email-confirmation"
            />
            <div className="flex items-center gap-2">
              <ChangeEmailFormActions />
              <Button variant="outline" asChild data-testid="cancel-edit-email">
                <Link href="/profile">{t('profile:actions.cancel')}</Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function FormChangePassword() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation('profile');
  const validationSchema = useValidationChangePasswordSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileChangePasswordFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      oldPassword: '',
      password: '',
      passwordConfirmation: '',
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({
      password: formData.password,
      oldPassword: formData.oldPassword,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<
          keyof EditProfileChangePasswordFormData
        >
      ).forEach((key) => {
        setError(key, {
          type: 'manual',
          message: t(
            `profile:inputs.${key}.validation.server.${data.errors[key]}`,
          ),
        });
      });

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      reset();

      enqueueSnackbar(t('profile:alerts.password.success'), {
        variant: 'success',
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t('profile:title3')}
            </h2>
            <FormTextInput<EditProfileChangePasswordFormData>
              name="oldPassword"
              label={t('profile:inputs.oldPassword.label')}
              type="password"
              testId="old-password"
            />
            <FormTextInput<EditProfileChangePasswordFormData>
              name="password"
              label={t('profile:inputs.password.label')}
              type="password"
              testId="new-password"
            />
            <FormTextInput<EditProfileChangePasswordFormData>
              name="passwordConfirmation"
              label={t('profile:inputs.passwordConfirmation.label')}
              type="password"
              testId="password-confirmation"
            />
            <div className="flex items-center gap-2">
              <ChangePasswordFormActions />
              <Button
                variant="outline"
                asChild
                data-testid="cancel-edit-password"
              >
                <Link href="/profile">{t('profile:actions.cancel')}</Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function FormChangeEmailWrapper() {
  const { user } = useAuth();
  return user?.provider === UserProviderEnum.EMAIL ? <FormChangeEmail /> : null;
}

function FormChangePasswordWrapper() {
  const { user } = useAuth();
  return user?.provider === UserProviderEnum.EMAIL ? (
    <FormChangePassword />
  ) : null;
}

function EditProfile() {
  return (
    <>
      <FormBasicInfo />
      <FormChangeEmailWrapper />
      <FormChangePasswordWrapper />
    </>
  );
}

export default withPageRequiredAuth(EditProfile);
