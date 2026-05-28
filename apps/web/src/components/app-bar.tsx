'use client';
import { useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useAuth from '@/services/auth/use-auth';
import useAuthActions from '@/services/auth/use-auth-actions';
import { useTranslation } from '@/services/i18n/client';
import Link from '@/components/link';
import { RoleEnum } from '@/services/api/types/role';
import ThemeSwitchButton from '@/components/switch-theme-button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { IS_SIGN_UP_ENABLED } from '@/services/auth/config';

function ResponsiveAppBar() {
  const { t } = useTranslation('common');
  const { user, isLoaded } = useAuth();
  const { logOut } = useAuthActions();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin =
    !!user?.role && [RoleEnum.ADMIN].includes(Number(user?.role?.id));

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center gap-4 px-4">
          {/* Logo */}
          <Link
            href="/"
            className="font-mono font-bold tracking-widest text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            {t('common:app-name')}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-1 items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">{t('common:navigation.home')}</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs">Docs</Link>
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin-panel">
                  {t('common:navigation.dashboard')}
                </Link>
              </Button>
            )}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeSwitchButton />
            <LanguageSwitcher />

            {!isLoaded ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="outline-none"
                    data-testid="profile-menu-item"
                    aria-label="Profile menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.photo?.path}
                        alt={`${user.firstName} ${user.lastName}`}
                      />
                      <AvatarFallback className="bg-[var(--color-accent)] text-black text-xs font-bold">
                        {user.firstName?.[0]}
                        {user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2"
                      data-testid="user-profile"
                    >
                      <User className="h-4 w-4" />
                      {t('common:navigation.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logOut}
                    className="flex items-center gap-2 text-[var(--color-warn)]"
                    data-testid="logout-menu-item"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('common:navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/sign-in">{t('common:navigation.signIn')}</Link>
                </Button>
                {IS_SIGN_UP_ENABLED && (
                  <Button variant="default" size="sm" asChild>
                    <Link href="/sign-up">{t('common:navigation.signUp')}</Link>
                  </Button>
                )}
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav — rendered outside <header> so it never changes header height */}
      {mobileMenuOpen && (
        <nav className="fixed top-14 left-0 right-0 z-40 md:hidden border-t border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            asChild
            onClick={() => setMobileMenuOpen(false)}
          >
            <Link href="/">{t('common:navigation.home')}</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start"
            asChild
            onClick={() => setMobileMenuOpen(false)}
          >
            <Link href="/docs">Docs</Link>
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              asChild
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/admin-panel/users">
                {t('common:navigation.users')}
              </Link>
            </Button>
          )}
          {!user && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/sign-in">{t('common:navigation.signIn')}</Link>
              </Button>
              {IS_SIGN_UP_ENABLED && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/sign-up">{t('common:navigation.signUp')}</Link>
                </Button>
              )}
            </>
          )}
        </nav>
      )}
    </>
  );
}
export default ResponsiveAppBar;
