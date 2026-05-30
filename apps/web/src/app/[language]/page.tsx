import type { Metadata } from 'next';
import { getServerTranslation } from '@/services/i18n';
import AssessmentGate from './assessment-gate';
import HeroSection from '@/components/landing/hero';
import StatsBar from '@/components/landing/stats-bar';
import ProblemSection from '@/components/landing/problem';
import FeaturesSection from '@/components/landing/features';
import HowItWorks from '@/components/landing/how-it-works';
import OpenSourceSection from '@/components/landing/open-source';
import CtaSection from '@/components/landing/cta';
import Footer from '@/components/landing/footer';

type Props = {
  params: Promise<{ language: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getServerTranslation(params.language, 'home');
  return { title: t('title') };
}

export default function HomePage() {
  return (
    <main>
      <AssessmentGate />
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorks />
      <OpenSourceSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
