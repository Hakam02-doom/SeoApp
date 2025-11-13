'use client';

import Image from 'next/image';
import { useState } from 'react';
import ScrollAnimation from './ScrollAnimation';

function StepImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 rounded-2xl">
        <span>Screenshot placeholder</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      className="w-full h-full object-contain"
      onError={() => setHasError(true)}
      unoptimized
    />
  );
}

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Keyword discovery",
      subtitle: "Zero-in on keywords that actually move the needle",
      description: "Discover what your audience is searching for in Google and AI chats like ChatGPT. RankYak automatically finds high-potential keywords based on your website and niche — no manual research needed.",
      image: "/images/keywords.png",
      alt: "Keywords management interface showing keyword list with search volume, difficulty, and planned dates",
    },
    {
      number: 2,
      title: "Content plan",
      subtitle: "Stay consistent without the stress",
      description: "RankYak decides which keyword to target every single day. You'll always have a clear content roadmap that keeps your site growing, without having to plan it yourself.",
      image: "/images/calendar.png",
      alt: "Calendar view showing content plan with articles scheduled for each day",
    },
    {
      number: 3,
      title: "Article creation",
      subtitle: "High-quality, SEO-optimized content at scale",
      description: "RankYak writes your articles for you — fully optimized and ready to rank. Each piece is structured, engaging, and designed to bring in real traffic.",
      image: "/images/article-editor.png",
      alt: "Article editor interface with SEO analysis sidebar showing article score and metrics",
    },
    {
      number: 4,
      title: "Publishing",
      subtitle: "Your content goes live automatically",
      description: "RankYak publishes directly to your website — no copy-pasting, no manual uploads. Whether you're on WordPress, Shopify, Webflow, or custom CMS, your site stays fresh with new content daily.",
      image: "/images/integrations.png",
      alt: "Integration settings page showing platform connections for automated publishing",
    },
    {
      number: 5,
      title: "Backlink exchange",
      subtitle: "Boost your SEO with quality backlinks",
      description: "RankYak builds a profile of high-quality backlinks to improve your site's authority for you. It automatically connects your website with others in our network and exchanges backlinks on full autopilot.",
      image: "/images/backlinks.png",
      alt: "Backlinks dashboard showing backlink growth chart and received backlinks table",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          How it works
        </h2>
        <p className="text-xl text-gray-600 text-center mb-16">
          Your SEO team on autopilot.
        </p>
        <p className="text-lg text-gray-600 text-center mb-16 max-w-3xl mx-auto">
          From keyword to published article — RankYak does it all, so you can focus on running your business.
        </p>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <ScrollAnimation key={step.number} delay={index * 0.2}>
            <div
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {step.title}
                  </h3>
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                  {step.subtitle}
                </h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {step.description}
                </p>
              </div>
              <div className="flex-1 w-full">
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white min-h-[400px] md:min-h-[500px]">
                  <StepImage src={step.image} alt={step.alt} />
                </div>
              </div>
            </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}