'use client';

import ScrollAnimation from './ScrollAnimation';

export default function Features() {
  const features = [
    {
      title: "Keyword discovery",
      description: "Discovers what your audience is searching for.",
    },
    {
      title: "Monthly content plan",
      description: "Strategically plans and organizes a content calendar.",
    },
    {
      title: "Article generation",
      description: "Generates articles every day that are SEO optimized.",
    },
    {
      title: "Auto-publishing",
      description: "Articles are published to your site fully automated.",
    },
    {
      title: "Backlink exchange",
      description: "Hands-off backlink building to improve rankings.",
    },
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Features
        </h2>
        <p className="text-xl text-gray-600 text-center mb-12">
          Features — all on full autopilot
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <ScrollAnimation key={index} delay={index * 0.1}>
            <div
              className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
}
