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
import FAQ from '@/components/FAQ';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <RealitySection />
      <HowItWorks />
      <VideoSection />
      <WhyItWorks />
      <Features />
      <Integrations />
      <Pricing />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}

