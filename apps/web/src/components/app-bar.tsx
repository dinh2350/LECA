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
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(12,9,7,0.82)',
          backdropFilter: 'blur(28px) saturate(1.4)',
          borderBottom: '1px solid var(--leca-border)',
          height: '64px',
        }}
      >
        <div className="mx-auto flex h-full max-w-screen-xl items-center gap-6 px-12">
          {/* Logo */}
          <Link href="/" className="no-underline leca-logo">
            L<span className="leca-logo-accent">E</span>CA
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex flex-1 items-center gap-6">
            {[
              { href: '/#problem', label: 'Problem' },
              { href: '/#features', label: 'Features' },
              { href: '/#how', label: 'How it works' },
              { href: '/#oss', label: 'Open Source' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="leca-nav-link">
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin-panel" className="leca-nav-link">
                {t('common:navigation.dashboard')}
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />

            {!isLoaded ? (
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid var(--amber)',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
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
                      <AvatarFallback
                        style={{
                          background: 'var(--amber-s)',
                          color: 'var(--amber)',
                          fontSize: '12px',
                          fontWeight: 700,
                          fontFamily: 'var(--fd)',
                        }}
                      >
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
              <div className="hidden md:flex items-center gap-3">
                <Link href="/sign-in" className="leca-nav-link">
                  {t('common:navigation.signIn')}
                </Link>
                {IS_SIGN_UP_ENABLED && (
                  <Link href="/sign-up" className="leca-nav-cta">
                    {t('common:navigation.signUp')}
                  </Link>
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
        <nav
          className="fixed left-0 right-0 z-40 md:hidden flex flex-col gap-1 px-4 py-2"
          style={{
            top: '64px',
            background: 'rgba(12,9,7,0.96)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid var(--leca-border)',
          }}
        >
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
