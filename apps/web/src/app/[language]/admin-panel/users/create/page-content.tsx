'use client';

import { useForm, FormProvider, useFormState } from 'react-hook-form';
import FormTextInput from '@/components/form/text-input/form-text-input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useSnackbar } from '@/hooks/use-snackbar';
import Link from '@/components/link';
import FormAvatarInput from '@/components/form/avatar-input/form-avatar-input';
import { FileEntity } from '@/services/api/types/file-entity';
import useLeavePage from '@/services/leave-page/use-leave-page';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useTranslation } from '@/services/i18n/client';
import { usePostUserService } from '@/services/api/services/users';
import { useRouter } from 'next/navigation';
import { Role, RoleEnum } from '@/services/api/types/role';
import FormSelectInput from '@/components/form/select/form-select';
import { Button } from '@/components/ui/button';

type CreateFormData = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirmation: string;
  photo?: FileEntity;
  role: Role;
};

const useValidationSchema = () => {
  const { t } = useTranslation('admin-panel-users-create');

  const schema = z
    .object({
      email: z
        .string()
        .email(t('admin-panel-users-create:inputs.email.validation.invalid'))
        .min(
          1,
          t('admin-panel-users-create:inputs.firstName.validation.required'),
        ),
      firstName: z
        .string()
        .min(
          1,
          t('admin-panel-users-create:inputs.firstName.validation.required'),
        ),
      lastName: z
        .string()
        .min(
          1,
          t('admin-panel-users-create:inputs.lastName.validation.required'),
        ),
      password: z
        .string()
        .min(6, t('admin-panel-users-create:inputs.password.validation.min')),
      passwordConfirmation: z
        .string()
        .min(
          1,
          t(
            'admin-panel-users-create:inputs.passwordConfirmation.validation.required',
          ),
        ),
      role: z
        .object({
          id: z.union([z.string(), z.number()]),
          name: z.string().optional(),
        })
        .refine(
          (obj) => obj.id !== undefined && obj.id !== null,
          t('admin-panel-users-create:inputs.role.validation.required'),
        ),
    })
    .refine((data) => data.passwordConfirmation === data.password, {
      message: t(
        'admin-panel-users-create:inputs.passwordConfirmation.validation.match',
      ),
      path: ['passwordConfirmation'],
    });

  return schema;
};

function CreateUserFormActions() {
  const { t } = useTranslation('admin-panel-users-create');
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button
      type="submit"
      disabled={isSubmitting}
      data-testid="create-user-submit"
    >
      {t('admin-panel-users-create:actions.submit')}
    </Button>
  );
}

function FormCreateUser() {
  const fetchPostUser = usePostUserService();
  const { t } = useTranslation('admin-panel-users-create');
  const validationSchema = useValidationSchema();
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  const methods = useForm<CreateFormData>({
    resolver: zodResolver(validationSchema as any),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      passwordConfirmation: '',
      role: { id: RoleEnum.USER },
      photo: undefined,
    },
  });

  const { handleSubmit, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchPostUser(formData);
    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (Object.keys(data.errors) as Array<keyof CreateFormData>).forEach(
        (key) => {
          setError(key, {
            type: 'manual',
            message: t(
              `admin-panel-users-create:inputs.${key}.validation.server.${data.errors[key]}`,
            ),
          });
        },
      );
      return;
    }
    if (status === HTTP_CODES_ENUM.CREATED) {
      enqueueSnackbar(t('admin-panel-users-create:alerts.user.success'), {
        variant: 'success',
      });
      router.push('/admin-panel/users');
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="max-w-xs mx-auto px-4">
        <form onSubmit={onSubmit} autoComplete="create-new-user">
          <div className="flex flex-col gap-4 mb-6 mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {t('admin-panel-users-create:title')}
            </h2>
            <FormAvatarInput<CreateFormData> name="photo" testId="photo" />
            <FormTextInput<CreateFormData>
              name="email"
              testId="new-user-email"
              autoComplete="new-user-email"
              label={t('admin-panel-users-create:inputs.email.label')}
            />
            <FormTextInput<CreateFormData>
              name="password"
              type="password"
              testId="new-user-password"
              autoComplete="new-user-password"
              label={t('admin-panel-users-create:inputs.password.label')}
            />
            <FormTextInput<CreateFormData>
              name="passwordConfirmation"
              testId="new-user-password-confirmation"
              label={t(
                'admin-panel-users-create:inputs.passwordConfirmation.label',
              )}
              type="password"
            />
            <FormTextInput<CreateFormData>
              name="firstName"
              testId="first-name"
              label={t('admin-panel-users-create:inputs.firstName.label')}
            />
            <FormTextInput<CreateFormData>
              name="lastName"
              testId="last-name"
              label={t('admin-panel-users-create:inputs.lastName.label')}
            />
            <FormSelectInput<CreateFormData, Pick<Role, 'id'>>
              name="role"
              testId="role"
              label={t('admin-panel-users-create:inputs.role.label')}
              options={[{ id: RoleEnum.ADMIN }, { id: RoleEnum.USER }]}
              keyValue="id"
              renderOption={(option) =>
                t(`admin-panel-users-create:inputs.role.options.${option.id}`)
              }
            />
            <div className="flex items-center gap-2">
              <CreateUserFormActions />
              <Button variant="outline" asChild>
                <Link href="/admin-panel/users">
                  {t('admin-panel-users-create:actions.cancel')}
                </Link>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function CreateUser() {
  return <FormCreateUser />;
}

export default withPageRequiredAuth(CreateUser);
