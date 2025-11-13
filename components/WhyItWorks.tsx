'use client';

import ScrollAnimation from './ScrollAnimation';

export default function WhyItWorks() {
  const features = [
    {
      title: "Search intent",
      description: "Understands what searchers really want. Articles match Google's interpretation of intent for higher relevance.",
    },
    {
      title: "Helpful content",
      description: "Content Google trusts. Each article balances experience, expertise, authority, and trust, with People Also Ask and People Also Search For included.",
    },
    {
      title: "Competitor research",
      description: "Modeled on what already wins. Articles are structured after analyzing top-ranking competitors for maximum ranking power.",
    },
    {
      title: "Your brand voice",
      description: "Content that sounds like you. Writing adapts to your style and tone.",
    },
    {
      title: "Human-like content",
      description: "Readable and natural. AI output is polished into smooth, engaging articles that sound human.",
    },
    {
      title: "Multilingual support",
      description: "Global reach. Research and articles are tailored to your country and language with 40+ supported languages.",
    },
    {
      title: "Internal linking",
      description: "Smarter site structure. Articles automatically link to each other for stronger rankings.",
    },
    {
      title: "Topic clusters",
      description: "Automatically builds topical authority. Related keywords are grouped into clusters, leading to connected articles that strengthen your rankings.",
    },
    {
      title: "Facts and citations",
      description: "Research-backed, not generic AI. Articles pull in verified facts and cite trustworthy sources, boosting credibility and trust.",
    },
    {
      title: "Uniqueness",
      description: "Fresh content every time. Each article is generated from scratch with custom research, so your site never blends in with AI clones.",
    },
    {
      title: "Search Console",
      description: "Data-driven SEO. Connect Google Search Console to feed real performance data into your strategy.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Why it works
        </h2>
        <p className="text-xl text-gray-600 text-center mb-8">
          Maximum visibility in Google and AI chats.
        </p>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
          Anyone can generate a blog post with AI — but that doesn't mean it will rank. RankYak articles are built on advanced research and SEO frameworks to match exactly what Google (and your audience) wants to see.
        </p>

        {/* AI Platform Logos */}
        <div className="flex justify-center items-center gap-8 mb-16 flex-wrap">
          <div className="flex items-center gap-2 text-2xl font-semibold text-gray-700">
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </div>
          <div className="flex items-center gap-2 text-2xl font-semibold text-gray-700">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0L14.5 8.5L23 11L14.5 13.5L12 22L9.5 13.5L1 11L9.5 8.5L12 0Z" fill="#10A37F"/>
            </svg>
            ChatGPT
          </div>
          <div className="text-2xl font-semibold text-gray-700">Gemini</div>
          <div className="text-2xl font-semibold text-gray-700">Perplexity</div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <ScrollAnimation key={index} delay={index * 0.1}>
            <div
              className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">
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
