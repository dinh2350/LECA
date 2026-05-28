'use client';

import useAuth from '@/services/auth/use-auth';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import Link from '@/components/link';
import { useTranslation } from '@/services/i18n/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation('profile');

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20 shrink-0" data-testid="user-icon">
          <AvatarImage
            src={user?.photo?.path}
            alt={`${user?.firstName} ${user?.lastName}`}
          />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <h1
            className="text-3xl font-bold text-[var(--color-foreground)]"
            data-testid="user-name"
          >
            {user?.firstName} {user?.lastName}
          </h1>
          <p
            className="text-lg text-[var(--color-muted)]"
            data-testid="user-email"
          >
            {user?.email}
          </p>
          <div>
            <Button asChild data-testid="edit-profile">
              <Link href="/profile/edit">{t('profile:actions.edit')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(Profile);
