'use client';

import ScrollAnimation from './ScrollAnimation';

export default function RealitySection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          The reality
        </h2>
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900">
          SEO drains time, money, and energy.
        </h3>
        <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto mb-16">
          Most businesses lack the time or budget for SEO. They don't have the resources to hire an in-house SEO team or the budget to work with expensive agencies — so competitors take the traffic and customers.
        </p>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Old Way */}
          <div className="bg-red-50 p-8 rounded-2xl">
            <h4 className="text-xl font-bold mb-6 text-gray-900">Doing SEO the old way</h4>
            <p className="text-gray-700 mb-6 font-semibold">Wasting hours and budgets on:</p>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Guessing the right keywords</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Content stuck on page 10</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Paying for a stack of tools</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Publishing inconsistently</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Manual backlink outreach</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span>Juggling clients and sites by hand</span>
              </li>
            </ul>
            <p className="mt-6 text-gray-600 italic">SEO that works — but drains your time and budget.</p>
          </div>

          {/* RankYak Way */}
          <div className="bg-green-50 p-8 rounded-2xl">
            <h4 className="text-xl font-bold mb-6 text-gray-900">RankYak</h4>
            <p className="text-gray-700 mb-6 font-semibold">All done for you:</p>
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Smart keyword discovery</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Content designed to rank</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>One platform for everything</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Daily publishing on autopilot</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Automatic backlink building</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Effortless multi-site management</span>
              </li>
            </ul>
            <p className="mt-6 text-gray-600 italic">SEO that works for you — faster, cheaper, on autopilot.</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">10x</div>
            <div className="text-gray-600">Faster than manual SEO</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">90%</div>
            <div className="text-gray-600">Less time on SEO tasks</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">3x</div>
            <div className="text-gray-600">More content ranking</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-gray-600">SEO that never takes a break</div>
          </div>
        </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
