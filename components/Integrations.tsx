'use client';

import Link from 'next/link';
import ScrollAnimation from './ScrollAnimation';

export default function Integrations() {
  const integrations = [
    { 
      name: "WordPress", 
      logo: "W",
      logoColor: "text-white",
      bgColor: "bg-slate-800"
    },
    { 
      name: "Zapier", 
      logo: "zapier",
      logoColor: "text-orange-500",
      bgColor: "bg-slate-800",
      isZapier: true
    },
    { 
      name: "Webflow", 
      logo: "W",
      logoColor: "text-blue-400",
      bgColor: "bg-slate-800"
    },
    { 
      name: "make", 
      logo: "M",
      logoColor: "text-purple-400",
      bgColor: "bg-slate-800"
    },
    { 
      name: "shopify", 
      logo: "shopify",
      logoColor: "text-green-400",
      bgColor: "bg-slate-800",
      isIcon: true
    },
    { 
      name: "WIX", 
      logo: "WIX",
      logoColor: "text-white",
      bgColor: "bg-slate-800",
      isText: true
    },
  ];

  return (
    <section id="integrations" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 rounded-3xl my-20 mx-4 sm:mx-6 lg:mx-8">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text and CTA */}
          <div>
            <p className="text-sm text-gray-400 uppercase tracking-wide mb-2">
              Integrations
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Connect once. RankYak handles the rest.
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              RankYak plugs directly into your website and tools — no complex setup required. Whether you're on WordPress, Shopify, Webflow, or a custom CMS, your articles are published automatically.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors shadow-lg"
            >
              Try for free
            </Link>
          </div>

          {/* Right Column - Integrations Grid */}
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6 auto-rows-fr">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className={`${integration.bgColor} p-6 rounded-xl hover:bg-slate-700 transition-colors flex flex-col items-center justify-center aspect-square`}
                >
                  {integration.isIcon ? (
                    // Shopify shopping bag icon
                    <svg className={`w-10 h-10 mb-2 ${integration.logoColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                      <line x1="3" y1="6" x2="21" y2="6"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  ) : integration.isZapier ? (
                    // Zapier lightning bolt logo
                    <svg className={`w-10 h-10 mb-2 ${integration.logoColor}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  ) : integration.isText ? (
                    // Text-based logos (Wix)
                    <div className={`text-xl font-bold ${integration.logoColor} mb-2 text-center`}>
                      {integration.logo}
                    </div>
                  ) : (
                    // Letter-based logos (WordPress, Webflow, Make)
                    <div className={`text-4xl font-bold ${integration.logoColor} mb-2`}>
                      {integration.logo}
                    </div>
                  )}
                  <div className="text-white text-sm font-medium text-center lowercase">
                    {integration.name}
                  </div>
                </div>
              ))}
            </div>
            
            {/* API/Webhooks Text */}
            <p className="text-gray-400 text-sm text-center">
              <span className="inline-block mr-2">{"</>"}</span>
              Or use our API and webhooks to integrate your own platform
            </p>
          </div>
        </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}