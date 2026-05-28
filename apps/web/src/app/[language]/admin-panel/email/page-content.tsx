'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFormState } from 'react-hook-form';
import {
  useSendEmailService,
  useGetEmailLogsService,
  SendEmailRequest,
  EmailLog,
} from '@/services/api/services/email';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { Button } from '@/components/ui/button';
import { useSnackbar } from '@/hooks/use-snackbar';

const emailLogsQueryKey = ['admin-email-logs'] as const;

function statusBadgeClass(status: EmailLog['status']): string {
  if (status === 'sent')
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (status === 'failed')
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
}

function EmailPage() {
  const { t } = useTranslation('admin-panel-email');
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const sendEmail = useSendEmailService();
  const getEmailLogs = useGetEmailLogsService();

  const { register, handleSubmit, reset, control } =
    useForm<SendEmailRequest>();
  const { errors, isSubmitting } = useFormState({ control });

  const {
    data: logs,
    isLoading,
    isError,
  } = useQuery({
    queryKey: emailLogsQueryKey,
    queryFn: async () => {
      const response = await getEmailLogs();
      if (response.status !== HTTP_CODES_ENUM.OK) {
        enqueueSnackbar(t('alerts.fetchError'), { variant: 'error' });
        throw new Error('Failed to fetch email logs');
      }
      return response.data?.data ?? [];
    },
  });

  const onSubmit = async (data: SendEmailRequest) => {
    const result = await sendEmail(data);
    const isSuccess =
      result.status === HTTP_CODES_ENUM.OK ||
      result.status === HTTP_CODES_ENUM.CREATED;
    if (isSuccess) {
      enqueueSnackbar(t('alerts.sendSuccess'), { variant: 'success' });
      reset();
      await queryClient.invalidateQueries({ queryKey: emailLogsQueryKey });
    } else {
      enqueueSnackbar(t('alerts.sendError'), { variant: 'error' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-6">
        {t('title')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Test Email Form */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-4">
            {t('sendForm.heading')}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-4">
              <label
                htmlFor="email-to"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                {t('sendForm.to')}
              </label>
              <input
                id="email-to"
                type="email"
                placeholder={t('sendForm.toPlaceholder')}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                {...register('to', {
                  required: t('sendForm.errors.required'),
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: t('sendForm.errors.invalidEmail'),
                  },
                })}
              />
              {errors.to && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.to.message}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="email-subject"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                {t('sendForm.subject')}
              </label>
              <input
                id="email-subject"
                type="text"
                placeholder={t('sendForm.subjectPlaceholder')}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                {...register('subject', {
                  required: t('sendForm.errors.required'),
                })}
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.subject.message}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label
                htmlFor="email-body"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                {t('sendForm.body')}
              </label>
              <textarea
                id="email-body"
                rows={5}
                placeholder={t('sendForm.bodyPlaceholder')}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                {...register('body', {
                  required: t('sendForm.errors.required'),
                })}
              />
              {errors.body && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.body.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? t('sendForm.sending') : t('sendForm.submit')}
            </Button>
          </form>
        </div>

        {/* Email Log Table */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
              {t('log.heading')}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: emailLogsQueryKey })
              }
            >
              {t('log.refresh')}
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-[var(--color-muted)]">
              {t('common:loading')}
            </div>
          ) : isError ? (
            <p className="text-center text-sm text-destructive py-8">
              {t('alerts.fetchError')}
            </p>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-muted)]">
              {t('log.empty')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="pb-2 text-left font-medium text-[var(--color-muted)]">
                      {t('log.columns.recipient')}
                    </th>
                    <th className="pb-2 text-left font-medium text-[var(--color-muted)]">
                      {t('log.columns.subject')}
                    </th>
                    <th className="pb-2 text-left font-medium text-[var(--color-muted)]">
                      {t('log.columns.status')}
                    </th>
                    <th className="pb-2 text-left font-medium text-[var(--color-muted)]">
                      {t('log.columns.sentAt')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-[var(--color-border)] last:border-0"
                    >
                      <td className="py-2 pr-3 text-[var(--color-foreground)] truncate max-w-[120px]">
                        {log.recipient}
                      </td>
                      <td className="py-2 pr-3 text-[var(--color-foreground)] truncate max-w-[120px]">
                        {log.subject}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(log.status)}`}
                        >
                          {t(`log.status.${log.status}`)}
                        </span>
                      </td>
                      <td className="py-2 text-[var(--color-muted)] whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(EmailPage, { roles: [RoleEnum.ADMIN] });
