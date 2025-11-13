'use client';

import ScrollAnimation from './ScrollAnimation';

export default function VideoSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            See RankYak in Action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how RankYak automates your entire SEO workflow from keyword discovery to published content.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video">
            <video
              className="w-full h-full object-contain"
              controls
              preload="metadata"
              poster=""
            >
              <source src="/videos/video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
