'use client';

import Image from 'next/image';
import Link from 'next/link';
import ScrollAnimation from './ScrollAnimation';

export default function CTASection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
          {/* Gradient border wrapper */}
          <div className="relative rounded-2xl p-[3px] bg-gradient-to-r from-pink-400 via-rose-400 to-orange-400 shadow-lg shadow-pink-300/60">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900">
              {/* Background Image */}
              <div className="absolute inset-0">
              <Image
                src="/images/cta-background.jpg"
                alt=""
                fill
                className="object-cover"
                priority
                unoptimized
              />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-slate-900/80"></div>
            </div>
            
            {/* Content */}
            <div className="relative px-8 md:px-12 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Left side - Text */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Automate your SEO and increase your ranking
                </h2>
                <p className="text-lg md:text-xl text-white/90">
                  Start today and generate your first article within 15 minutes.
                </p>
              </div>
              
              {/* Right side - Button */}
              <div className="flex-shrink-0">
                <Link
                  href="/dashboard"
                  className="inline-block bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg"
                >
                  Start your free trial
                </Link>
              </div>
            </div>
          </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}