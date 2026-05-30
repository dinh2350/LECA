'use client';

import { useAssessmentGate } from '@/hooks/use-assessment-gate';

/**
 * Invisible client component that triggers the assessment gate check.
 * Renders nothing — only runs the hook to redirect unauthenticated
 * new users to the onboarding assessment.
 */
export default function AssessmentGate() {
  useAssessmentGate();
  return null;
}
