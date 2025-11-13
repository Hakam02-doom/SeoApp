'use client';

import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does RankYak work?",
      answer: "RankYak makes SEO automated and data-driven. We help businesses grow their organic traffic by automating keyword research, content creation, and backlink building — all based on real performance data and competition analysis. Our platform continuously identifies new ranking opportunities for your website and writes optimized articles tailored to your niche. Every piece of content is designed to follow Google's best practices and adapt to changing search trends. RankYak was built by SEO professionals and engineers who wanted to remove the repetitive, manual work from SEO, without sacrificing quality or results. The result is a platform that makes consistent SEO growth simple, predictable, and scalable.",
    },
    {
      question: "Are the articles SEO-optimized?",
      answer: "Yes, all articles are built from scratch with SEO in mind. It uses real-time SERP data, analyzes the top-ranking pages for the target keyword, and follows Google's guidelines like E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). Each article also includes meta data, a strong heading structure, optimized keyword density, and internal and external linking. This will help you rank higher on search engines and be more visible in AI chats.",
    },
    {
      question: "Will RankYak also help with visibility in AI chats?",
      answer: "Yes, RankYak articles are designed to be comprehensive and authoritative, which helps improve visibility in AI chats like ChatGPT. By providing in-depth answers to user queries and covering related topics, your content is more likely to be referenced by AI models.",
    },
    {
      question: "How many articles are generated per month?",
      answer: "RankYak generates one SEO-optimized article every day, adding up to a full month of fresh content for your website. You can adjust the frequency of article creation in your project settings to fit your content strategy and goals.",
    },
    {
      question: "Can I add multiple websites to RankYak?",
      answer: "Yes, you can manage multiple websites under one account, each with its own subscription. This allows you to easily switch between websites within RankYak, each with its own keywords, content plan, and articles. We also offer discounts when you add multiple websites to your account.",
    },
    {
      question: "What platforms does RankYak integrate with?",
      answer: "RankYak integrates with WordPress, Wix, Shopify, WordPress.com, Webflow, Zapier, and Make. You can also use our RSS feed, API, and webhooks to integrate with your own platform.",
    },
    {
      question: "Does RankYak support multiple languages?",
      answer: "Yes, RankYak supports writing articles in 40+ languages: Arabic, Armenian, Azeri, Bengali, Bosnian, Bulgarian, Chinese (Simplified), Chinese (Traditional), Croatian, Czech, Danish, Dutch, English, Estonian, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Latvian, Lithuanian, Macedonian, Malay, Norwegian, Portuguese, Romanian, Russian, Serbian, Slovak, Slovenian, Spanish, Swedish, Tagalog, Thai, Turkish, Urdu, and Vietnamese.",
    },
    {
      question: "Can I review an article before it is published?",
      answer: "Yes, you can choose to have articles automatically published or saved as drafts for your review. This allows you to make any necessary edits or adjustments before the content goes live.",
    },
    {
      question: "Is AI content actually effective for SEO?",
      answer: "Yes, when done correctly, AI-generated content can be highly effective for SEO. RankYak uses advanced AI models to create high-quality, SEO-optimized articles that are tailored to your target keywords and audience. The key is to ensure that the content is relevant, well-structured, and provides value to readers, which RankYak is designed to do.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
