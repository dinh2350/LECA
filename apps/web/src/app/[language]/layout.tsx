import ResponsiveAppBar from '@/components/app-bar';
import AuthProvider from '@/services/auth/auth-provider';
import '../globals.css';
import { Bricolage_Grotesque, Lora, JetBrains_Mono } from 'next/font/google';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});
import { dir } from 'i18next';
import '@/services/i18n/config';
import { languages } from '@/services/i18n/config';
import type { Metadata } from 'next';
import ToastContainer from '@/components/snackbar-provider';
import { getServerTranslation } from '@/services/i18n';
import StoreLanguageProvider from '@/services/i18n/store-language-provider';
import ThemeProvider from '@/components/theme/theme-provider';
import LeavePageProvider from '@/services/leave-page/leave-page-provider';
import QueryClientProvider from '@/services/react-query/query-client-provider';
import queryClient from '@/services/react-query/query-client';
import ReactQueryDevtools from '@/services/react-query/react-query-devtools';
import GoogleAuthProvider from '@/services/social-auth/google/google-auth-provider';
import FacebookAuthProvider from '@/services/social-auth/facebook/facebook-auth-provider';
import ConfirmDialogProvider from '@/components/confirm-dialog/confirm-dialog-provider';

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, 'common');

  return {
    title: t('title'),
  };
}

export function generateStaticParams() {
  return languages.map((language) => ({ language }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ language: string }>;
}) {
  const params = await props.params;

  const { language } = params;

  const { children } = props;

  return (
    <html
      lang={language}
      dir={dir(language)}
      suppressHydrationWarning
      className={`${bricolage.variable} ${lora.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <ThemeProvider>
            <StoreLanguageProvider>
              <ConfirmDialogProvider>
                <AuthProvider>
                  <GoogleAuthProvider>
                    <FacebookAuthProvider>
                      <LeavePageProvider>
                        <ResponsiveAppBar />
                        {children}
                        <ToastContainer
                          position="bottom-left"
                          richColors
                          closeButton
                        />
                      </LeavePageProvider>
                    </FacebookAuthProvider>
                  </GoogleAuthProvider>
                </AuthProvider>
              </ConfirmDialogProvider>
            </StoreLanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
