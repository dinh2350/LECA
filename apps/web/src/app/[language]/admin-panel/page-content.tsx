'use client';

import { RoleEnum } from '@/services/api/types/role';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';

function AdminPanel() {
  const { t } = useTranslation('admin-panel-home');

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-2">
        {t('title')}
      </h1>
      <p className="text-sm text-[var(--color-muted)]">{t('description')}</p>
    </div>
  );
}

export default withPageRequiredAuth(AdminPanel, { roles: [RoleEnum.ADMIN] });
