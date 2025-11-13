'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { generateBlogBackgroundImage, generateGradientFromContent } from '@/lib/services/image-generator';

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticle() {
      try {
        setIsLoading(true);
        const response = await apiGet(`/api/articles/${id}`);
        
        if (response.error) {
          setError(response.error);
          return;
        }

        if (response.data?.article) {
          const articleData = response.data.article;
          setArticle(articleData);
          
          // Use default background
          try {
            const imageUrl = await generateBlogBackgroundImage({
              title: articleData.title,
              description: articleData.metaDescription,
              keyword: articleData.keyword?.keyword,
            });
            
            if (imageUrl) {
              setBackgroundImage(imageUrl);
            }
          } catch (err) {
            console.error('[Blog Page] Failed to get background:', err);
          }
        } else {
          setError('Article not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    }

    loadArticle();
  }, [id]);

  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (wordCount: number) => {
    return Math.ceil(wordCount / 200);
  };

  // Extract headings from content for table of contents
  const extractHeadings = (content: string) => {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const headings: Array<{ level: number; text: string; id: string }> = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ level, text, id });
    }

    return headings;
  };

  // Convert markdown to HTML (simple conversion)
  const markdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Process code blocks first (before escaping)
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-6"><code>${code.trim()}</code></pre>`;
    });
    
    // Process inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>');
    
    // Process headers (before paragraphs)
    html = html.replace(/^### (.*)$/gim, (match, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h3 id="${id}" class="text-2xl font-bold text-gray-900 mt-8 mb-4">${text}</h3>`;
    });
    html = html.replace(/^## (.*)$/gim, (match, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h2 id="${id}" class="text-3xl font-bold text-gray-900 mt-10 mb-6">${text}</h2>`;
    });
    html = html.replace(/^# (.*)$/gim, (match, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `<h1 id="${id}" class="text-4xl font-bold text-gray-900 mt-12 mb-8">${text}</h1>`;
    });
    
    // Process links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-700 underline">$1</a>');
    
    // Process bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Process italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Process lists (unordered)
    html = html.replace(/^\- (.*)$/gim, '<li class="text-lg text-gray-700 mb-2">$1</li>');
    html = html.replace(/^\* (.*)$/gim, '<li class="text-lg text-gray-700 mb-2">$1</li>');
    
    // Process numbered lists
    html = html.replace(/^\d+\. (.*)$/gim, '<li class="text-lg text-gray-700 mb-2">$1</li>');
    
    // Wrap consecutive list items
    html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => {
      return `<ul class="list-disc list-inside mb-6 space-y-2">${match}</ul>`;
    });
    
    // Process paragraphs (split by double newlines)
    const lines = html.split('\n');
    const processed: string[] = [];
    let currentPara: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // If it's already processed (header, list, code block), add it directly
      if (line.match(/^<(h[1-6]|ul|li|pre|code)/)) {
        if (currentPara.length > 0) {
          processed.push(`<p class="text-lg text-gray-700 leading-relaxed mb-6">${currentPara.join(' ')}</p>`);
          currentPara = [];
        }
        processed.push(line);
      } else if (line === '') {
        // Empty line - end current paragraph
        if (currentPara.length > 0) {
          processed.push(`<p class="text-lg text-gray-700 leading-relaxed mb-6">${currentPara.join(' ')}</p>`);
          currentPara = [];
        }
      } else {
        // Add to current paragraph
        currentPara.push(line);
      }
    }
    
    // Add remaining paragraph
    if (currentPara.length > 0) {
      processed.push(`<p class="text-lg text-gray-700 leading-relaxed mb-6">${currentPara.join(' ')}</p>`);
    }
    
    return processed.join('\n');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <p className="text-gray-600 mb-6">{error || 'The article you are looking for does not exist.'}</p>
          <Link href="/dashboard/blog" className="text-blue-600 hover:text-blue-700">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const headings = extractHeadings(article.content || '');
  const readingTime = calculateReadingTime(article.wordCount || 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6 lg:px-8">
        {/* Glass effect background - rounded container */}
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg overflow-hidden">
            {/* Subtle gradient overlay - more transparent */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-pink-50/10 pointer-events-none"></div>
            
            <nav className="relative px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <Link href="/" className="flex items-center gap-2 z-10">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-gray-900">RankYak</span>
                  <span className="text-sm text-gray-500 ml-2">the JOURNAL</span>
                </Link>
                <div className="hidden md:flex items-center gap-6">
                  <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
                  <div className="text-gray-700 hover:text-gray-900 cursor-pointer font-medium">
                    Products <span className="text-xs">↓</span>
                  </div>
                  <div className="text-gray-700 hover:text-gray-900 cursor-pointer font-medium">
                    Resources <span className="text-xs">↓</span>
                  </div>
                  <Link href="/pricing" className="text-gray-700 hover:text-gray-900 font-medium">Pricing</Link>
                  <button className="p-2 text-gray-700 hover:text-gray-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <Link href="/login" className="px-4 py-2 text-gray-700 hover:text-gray-900 rounded-lg font-medium">
                    Log in
                  </Link>
                  <Link href="/register" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    Sign up
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-24 pb-20 overflow-hidden min-h-[500px]">
        <div className="absolute inset-0">
          {backgroundImage && backgroundImage.startsWith('http') ? (
            // Unsplash image
            <div 
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${backgroundImage})`,
              }}
            >
              {/* Stronger gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.3),transparent_70%)]"></div>
            </div>
          ) : (
            // CSS gradient fallback
            <div 
              className="absolute inset-0 w-full h-full"
              style={{ 
                background: backgroundImage || (article 
                  ? generateGradientFromContent(article.title, article.keyword?.keyword)
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
              }}
            >
              {/* Gradient overlay for better text visibility on gradients too */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.2),transparent_60%)]"></div>
            </div>
          )}
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>
            {article.metaDescription && (
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                {article.metaDescription}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              {article.keyword && (
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm">
                  {article.keyword.keyword}
                </span>
              )}
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm">
                {article.status === 'published' ? 'Published' : 'Draft'}
              </span>
              <span className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-sm">
                {readingTime} min read
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Article Content */}
          <div className="lg:col-span-2">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg max-w-none"
            >
              {/* Drop Cap First Letter */}
              <div className="mb-8">
                {article.content && (
                  <>
                    <div className="flex items-start gap-4 mb-6">
                      <span className="text-8xl font-bold text-gray-900 leading-none mt-2 float-left mr-4" style={{ lineHeight: '0.8' }}>
                        {article.content.trim().charAt(0).toUpperCase()}
                      </span>
                      <div
                        className="flex-1 prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(article.content.trim().substring(1)) }}
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.article>

            {/* Article Metadata */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {article.project?.name?.charAt(0) || 'R'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Written by</p>
                  <p className="text-gray-600">{article.project?.name || 'RankYak'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Table of Contents */}
              {headings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-gray-50 rounded-xl p-6 mb-6"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
                  <ul className="space-y-2">
                    {headings.map((heading, index) => (
                      <li key={index}>
                        <a
                          href={`#${heading.id}`}
                          className={`block text-gray-600 hover:text-gray-900 transition-colors ${
                            heading.level === 2 ? 'font-medium' : 'text-sm ml-4'
                          }`}
                        >
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Article Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-gray-50 rounded-xl p-6 mb-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Article Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Word Count</span>
                    <span className="font-semibold text-gray-900">{article.wordCount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading Time</span>
                    <span className="font-semibold text-gray-900">{readingTime} min</span>
                  </div>
                  {article.seoScore && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">SEO Score</span>
                      <span className={`font-semibold ${
                        article.seoScore >= 80 ? 'text-green-600' :
                        article.seoScore >= 60 ? 'text-yellow-600' :
                        'text-orange-600'
                      }`}>
                        {article.seoScore}
                      </span>
                    </div>
                  )}
                  {article.headingCount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Headings</span>
                      <span className="font-semibold text-gray-900">{article.headingCount}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Back to Blog */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Link
                  href="/dashboard/blog"
                  className="block w-full text-center px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  ← Back to Blog
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

