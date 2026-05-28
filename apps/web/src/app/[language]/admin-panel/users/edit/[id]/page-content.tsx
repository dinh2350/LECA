'use client';

import { useForm, FormProvider, useFormState } from 'react-hook-form';
import FormTextInput from '@/components/form/text-input/form-text-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useEffect } from 'react';
import { useSnackbar } from '@/hooks/use-snackbar';
import Link from '@/components/link';
import FormAvatarInput from '@/components/form/avatar-input/form-avatar-input';
import { FileEntity } from '@/services/api/types/file-entity';
import useLeavePage from '@/services/leave-page/use-leave-page';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useTranslation } from '@/services/i18n/client';
import {
  useGetUserService,
  usePatchUserService,
} from '@/services/api/services/users';
import { useParams } from 'next/navigation';
import { Role, RoleEnum } from '@/services/api/types/role';
import FormSelectInput from '@/components/form/select/form-select';
import { Button } from '@/components/ui/button';

type EditUserFormData = {
  email: string;
  firstName: string;
  lastName: string;
  photo?: FileEntity;
  role: Role;
};

type ChangeUserPasswordFormData = {
  password: string;
  passwordConfirmation: string;
};

const useValidationEditUserSchema = () => {
  const { t } = useTranslation('admin-panel-users-edit');

  return z.object({
    email: z
      .string()
      .email(t('admin-panel-users-edit:inputs.email.validation.invalid'))
      .min(1, t('admin-panel-users-edit:inputs.firstName.validation.required')),
    firstName: z
      .string()
      .min(1, t('admin-panel-users-edit:inputs.firstName.validation.required')),
    lastName: z
      .string()
      .min(1, t('admin-panel-users-edit:inputs.lastName.validation.required')),
    role: z
      .object({
        id: z.union([z.string(), z.number()]),
        name: z.string().optional(),
      })
      .refine(
        (obj) => obj.id !== undefined && obj.id !== null,
        t('admin-panel-users-edit:inputs.role.validation.required'),
      ),
  });
};

const useValidationChangePasswordSchema = () => {
  const { t } = useTranslation('admin-panel-users-edit');

  return z
    .object({
      password: z
        .string()
        .min(6, t('admin-panel-users-edit:inputs.password.validation.min')),
      passwordConfirmation: z
        .string()
        .min(
          1,
          t(
            'admin-panel-users-edit:inputs.passwordConfirmation.validation.required',
          ),
        ),
    })
    .refine((data) => data.passwordConfirmation === data.password, {
      message: t(
        'admin-panel-users-edit:inputs.passwordConfirmation.validation.match',
      ),
      path: ['passwordConfirmation'],
    });
};

function EditUserFormActions() {
  const { t } = useTranslation('admin-panel-users-edit');
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting}>
      {t('admin-panel-users-edit:actions.submit')}
    </Button>
  );
}

function ChangePasswordUserFormActions() {
  const { t } = useTranslation('admin-panel-users-edit');
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting}>
      {t('admin-panel-users-edit:actions.submit')}
    </Button>
  );
}

function FormEditUser() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const fetchGetUser = useGetUserService();
  const fetchPatchUser = usePatchUserService();
  const { t } = useTranslation('admin-panel-users-edit');
  const validationSchema = useValidationEditUserSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditUserFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: undefined,
      photo: undefined,
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const isEmailDirty = methods.getFieldState('email').isDirty;
    const { data, status } = await fetchPatchUser({
      id: userId,
      data: {
        ...formData,
        email: isEmailDirty ? formData.email : undefined,
      },
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof EditUserFormData>).forEach(
        (key) => {
          setError(key, {
            type: 'manual',
            message: t(
              `admin-panel-users-edit:inputs.${key}.validation.server.${data.errors[key]}`,
            ),
          });
        },
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset(formData);
      enqueueSnackbar(t('admin-panel-users-edit:alerts.user.success'), {
        variant: 'success',
      });
    }
  });

  useEffect(() => {
    const getInitialDataForEdit = async () => {
      const { status, data: user } = await fetchGetUser({ id: userId });

      if (status === HTTP_CODES_ENUM.OK) {
        reset({
          email: user?.email ?? '',
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          role: { id: Number(user?.role?.id) },
          photo: user?.photo,
        });
      }
    };

    getInitialDataForEdit();
  }, [userId, reset, fetchGetUser]);

  return (
    <FormProvider {...methods}>
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 mb-6 mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t('admin-panel-users-edit:title1')}
            </h2>
            <FormAvatarInput<EditUserFormData> name="photo" testId="photo" />
            <FormTextInput<EditUserFormData>
              name="email"
              testId="email"
              label={t('admin-panel-users-edit:inputs.email.label')}
            />
            <FormTextInput<EditUserFormData>
              name="firstName"
              testId="first-name"
              label={t('admin-panel-users-edit:inputs.firstName.label')}
            />
            <FormTextInput<EditUserFormData>
              name="lastName"
              testId="last-name"
              label={t('admin-panel-users-edit:inputs.lastName.label')}
            />
            <FormSelectInput<EditUserFormData, Pick<Role, 'id'>>
              name="role"
              testId="role"
              label={t('admin-panel-users-edit:inputs.role.label')}
              options={[{ id: RoleEnum.ADMIN }, { id: RoleEnum.USER }]}
              keyValue="id"
              renderOption={(option) =>
                t(`admin-panel-users-edit:inputs.role.options.${option.id}`)
              }
            />
            <div className="flex items-center gap-2">
              <EditUserFormActions />
              <Button variant="outline" asChild>
                <Link href="/admin-panel/users">
                  {t('admin-panel-users-edit:actions.cancel')}
                </Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function FormChangePasswordUser() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const fetchPatchUser = usePatchUserService();
  const { t } = useTranslation('admin-panel-users-edit');
  const validationSchema = useValidationChangePasswordSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<ChangeUserPasswordFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      password: '',
      passwordConfirmation: '',
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPatchUser({
      id: userId,
      data: formData,
    });
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<keyof ChangeUserPasswordFormData>
      ).forEach((key) => {
        setError(key, {
          type: 'manual',
          message: t(
            `admin-panel-users-edit:inputs.${key}.validation.server.${data.errors[key]}`,
          ),
        });
      });
      return;
    }
    if (status === HTTP_CODES_ENUM.OK) {
      reset();
      enqueueSnackbar(t('admin-panel-users-edit:alerts.password.success'), {
        variant: 'success',
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-4 mb-6 mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t('admin-panel-users-edit:title2')}
            </h2>
            <FormTextInput<ChangeUserPasswordFormData>
              name="password"
              type="password"
              label={t('admin-panel-users-edit:inputs.password.label')}
            />
            <FormTextInput<ChangeUserPasswordFormData>
              name="passwordConfirmation"
              label={t(
                'admin-panel-users-edit:inputs.passwordConfirmation.label',
              )}
              type="password"
            />
            <div className="flex items-center gap-2">
              <ChangePasswordUserFormActions />
              <Button variant="outline" asChild>
                <Link href="/admin-panel/users">
                  {t('admin-panel-users-edit:actions.cancel')}
                </Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function EditUser() {
  return (
    <>
      <FormEditUser />
      <FormChangePasswordUser />
    </>
  );
}

export default withPageRequiredAuth(EditUser);
