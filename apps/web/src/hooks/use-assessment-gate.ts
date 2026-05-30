'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/services/auth/use-auth';
import useLanguage from '@/services/i18n/use-language';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { useGetAssessmentStatusService } from '@/services/api/services/assessments';

const SESSION_KEY = 'leca:assessment:checked';

/**
 * Checks once per browser session whether the authenticated user has completed
 * the level assessment. If not, redirects to the onboarding assessment page.
 *
 * Safe to call from a 'use client' component mounted inside a Server Component.
 * Skips entirely for unauthenticated users.
 */
export function useAssessmentGate() {
  const { user, isLoaded } = useAuth();
  const language = useLanguage();
  const router = useRouter();
  const getStatus = useGetAssessmentStatusService();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    // Only check once per browser session
    if (sessionStorage.getItem(SESSION_KEY) === 'done') return;
    if (hasChecked.current) return;
    hasChecked.current = true;

    getStatus().then(({ status, data }) => {
      if (status !== HTTP_CODES_ENUM.OK) return;
      if (!data.hasCompleted) {
        router.push(`/${language}/onboarding/assessment`);
      } else {
        sessionStorage.setItem(SESSION_KEY, 'done');
      }
    });
  }, [isLoaded, user, getStatus, language, router]);
}
