'use client';

import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RealitySection from '@/components/RealitySection';
import HowItWorks from '@/components/HowItWorks';
import VideoSection from '@/components/VideoSection';
import WhyItWorks from '@/components/WhyItWorks';
import Features from '@/components/Features';
import Integrations from '@/components/Integrations';
import Pricing from '@/components/Pricing';
import CTASection from '@/components/CTASection';

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <RealitySection />
      <HowItWorks />
      <VideoSection />
      <WhyItWorks />
      <Features />
      <Integrations />
      <Pricing />
      <CTASection />
    </>
  );
}

