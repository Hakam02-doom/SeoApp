'use client';

import Link from 'next/link';
import ScrollAnimation from './ScrollAnimation';

export default function Pricing() {
  const leftColumnFeatures = [
    "One SEO/GEO article generated and published every day",
    "Connect one website per subscription",
    "Automated keyword research and topic clustering",
    "Quality backlinks built for you on autopilot",
    "Content driven by real-time data and insights",
  ];

  const rightColumnFeatures = [
    "Relevant YouTube videos embedded in articles",
    "Automatic internal and external linking",
    "On-brand featured images",
    "Integrations with WordPress, Shopify, Wix, Webflow, and more",
    "Available in 40+ languages",
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Your all-in-one SEO platform</p>
        </div>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          Simple and transparent pricing.
        </h2>
        <p className="text-lg md:text-xl text-gray-900 mb-12">
          All you need, in one platform
        </p>

        <div className="max-w-5xl mx-auto">
          <ScrollAnimation>
          <div className="bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-white border border-pink-300/50 rounded-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Discount Banner */}
            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold z-10 shadow-sm">
              Currently 60% discount
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
              {/* Left Side - Pricing */}
              <div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="text-3xl md:text-4xl font-bold text-gray-400 line-through">
                      $247
                    </span>
                    <span className="text-6xl md:text-7xl font-bold text-gray-900">
                      $99
                    </span>
                    <span className="text-xl md:text-2xl text-gray-900">/month</span>
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors w-full text-center"
                  >
                    Start your free trial
                  </Link>
                </div>
              </div>

              {/* Right Side - Features */}
              <div>
                <p className="text-lg font-semibold text-gray-900 mb-6">
                  Start today with:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <ul className="space-y-3 text-gray-700">
                    {leftColumnFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Right Column */}
                  <ul className="space-y-3 text-gray-700">
                    {rightColumnFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm md:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          </ScrollAnimation>

          {/* Agency Partner Section */}
          <ScrollAnimation delay={0.3}>
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4">Agency Partner</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Resell our services to your clients with ease. Simplify your operations by managing all client accounts under one centralized dashboard. Unlock exclusive benefits, including volume-based discounts.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Get started for free
            </Link>
          </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}