'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';

export default function BlogPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlogs, setGeneratedBlogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'unplanned' | 'planned' | 'used' | undefined>(undefined);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Load keywords and blog posts
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        
        // Get first project
        const projectsRes = await apiGet('/api/projects');
        if (projectsRes.data?.projects && projectsRes.data.projects.length > 0) {
          const pid = projectsRes.data.projects[0].id;
          setProjectId(pid);

          // Load keywords
          const params = new URLSearchParams({ projectId: pid });
          if (statusFilter) {
            params.append('status', statusFilter);
          }
          if (searchQuery) {
            params.append('search', searchQuery);
          }

          const keywordsRes = await apiGet(`/api/keywords?${params.toString()}`);
          setKeywords(keywordsRes.data?.keywords || []);

          // Load blog posts (all articles)
          const articlesRes = await apiGet(`/api/articles?projectId=${pid}`);
          console.log('[Blog Page] Loaded articles:', articlesRes.data?.articles?.length || 0);
          if (articlesRes.data?.articles) {
            // Sort by createdAt descending (newest first)
            const sortedArticles = [...articlesRes.data.articles].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA;
            });
            setGeneratedBlogs(sortedArticles);
          } else {
            setGeneratedBlogs([]);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated, statusFilter, searchQuery]);

  const handleGenerateBlog = async (keywordId: string, keyword: string) => {
    if (!projectId || isGenerating) return;

    setIsGenerating(true);
    setSelectedKeyword(keywordId);

    try {
      console.log('[Blog Page] Generating blog for keyword:', keyword, keywordId);
      const response = await apiPost('/api/articles/generate', {
        projectId,
        keywordId,
        targetWordCount: 2000,
      });

      console.log('[Blog Page] Generate response:', response);

      if (response.error) {
        // Error toast is shown automatically by apiPost
        setIsGenerating(false);
        setSelectedKeyword(null);
        return;
      }

      if (response.data?.article) {
        console.log('[Blog Page] Article generated:', response.data.article.id, response.data.article.title);
        
        // Reload both keywords and articles to get fresh data
        try {
          // Reload keywords to update status
          const keywordsRes = await apiGet(`/api/keywords?projectId=${projectId}`);
          if (keywordsRes.data?.keywords) {
            setKeywords(keywordsRes.data.keywords);
          }
          
          // Reload articles to show the new blog post
          const articlesRes = await apiGet(`/api/articles?projectId=${projectId}`);
          console.log('[Blog Page] Reloaded articles:', articlesRes.data?.articles?.length || 0);
          if (articlesRes.data?.articles && articlesRes.data.articles.length > 0) {
            // Sort by createdAt descending (newest first)
            const sortedArticles = [...articlesRes.data.articles].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt || 0).getTime();
              const dateB = new Date(b.createdAt || 0).getTime();
              return dateB - dateA;
            });
            setGeneratedBlogs(sortedArticles);
            console.log('[Blog Page] Set articles:', sortedArticles.length);
          } else {
            // Fallback: add the new article to the list if reload didn't work
            console.log('[Blog Page] Using fallback - adding article to list');
            setGeneratedBlogs((prev) => {
              const newList = [response.data.article, ...prev];
              console.log('[Blog Page] Fallback list length:', newList.length);
              return newList;
            });
          }
        } catch (reloadError) {
          console.error('[Blog Page] Error reloading data:', reloadError);
          // Fallback: add the new article to the list
          setGeneratedBlogs((prev) => [response.data.article, ...prev]);
        }
        
        try {
          const toast = await import('@/lib/utils/toast');
          toast.showSuccess(`Blog post "${response.data.article.title}" generated successfully!`);
        } catch (e) {
          console.log('Blog post generated successfully!');
        }
      } else {
        console.error('[Blog Page] No article in response:', response);
        try {
          const toast = await import('@/lib/utils/toast');
          toast.showError('Blog post generated but no article data returned');
        } catch (e) {
          console.error('Blog post generated but no article data returned');
        }
      }
    } catch (error: any) {
      console.error('[Blog Page] Generate error:', error);
      try {
        const toast = await import('@/lib/utils/toast');
        toast.handleAPIError(error);
      } catch (e) {
        console.error('Failed to generate blog post:', error);
      }
    } finally {
      setIsGenerating(false);
      setSelectedKeyword(null);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 20) return 'bg-green-100 text-green-700';
    if (difficulty < 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-100 text-orange-700';
  };

  // Show loading while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="min-h-screen flex items-center justify-center py-12">
          <div className="text-center">
            {/* Modern animated loader */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
              
              {/* Inner pulsing circle */}
              <div className="absolute inset-4 bg-blue-600 rounded-full animate-pulse opacity-75"></div>
              
              {/* Center dot */}
              <div className="absolute inset-8 bg-blue-700 rounded-full"></div>
            </div>
            
            {/* Loading text with animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <h3 className="text-xl font-semibold text-gray-900">Loading your blog</h3>
              <p className="text-gray-600">Fetching keywords and articles...</p>
              
              {/* Animated dots */}
              <div className="flex items-center justify-center gap-1 pt-2">
                <motion.div
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-blue-600 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Filter keywords that haven't been used yet
  const availableKeywords = keywords.filter((k: any) => k.status !== 'used');

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog</h1>
            <p className="text-gray-600">Generate blog posts from your keywords to boost SEO and drive traffic.</p>
          </div>
          <button
            onClick={async () => {
              if (!projectId) return;
              setIsLoading(true);
              try {
                const articlesRes = await apiGet(`/api/articles?projectId=${projectId}`);
                if (articlesRes.data?.articles) {
                  const sortedArticles = [...articlesRes.data.articles].sort((a: any, b: any) => {
                    const dateA = new Date(a.createdAt || 0).getTime();
                    const dateB = new Date(b.createdAt || 0).getTime();
                    return dateB - dateA;
                  });
                  setGeneratedBlogs(sortedArticles);
                }
              } catch (error) {
                console.error('Failed to refresh:', error);
              } finally {
                setIsLoading(false);
              }
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="text-sm text-gray-600 mb-1">Available Keywords</div>
            <div className="text-2xl font-bold text-gray-900">{availableKeywords.length}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="text-sm text-gray-600 mb-1">Blog Posts</div>
            <div className="text-2xl font-bold text-gray-900">{generatedBlogs.length}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="text-sm text-gray-600 mb-1">Published</div>
            <div className="text-2xl font-bold text-gray-900">
              {generatedBlogs.filter((b: any) => b.status === 'published').length}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="text-sm text-gray-600 mb-1">Drafts</div>
            <div className="text-2xl font-bold text-gray-900">
              {generatedBlogs.filter((b: any) => b.status === 'draft').length}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Available Keywords */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Available Keywords</h2>
              
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filters */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setStatusFilter(undefined)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    statusFilter === undefined
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('unplanned')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    statusFilter === 'unplanned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unplanned
                </button>
                <button
                  onClick={() => setStatusFilter('planned')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    statusFilter === 'planned'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Planned
                </button>
              </div>

              {/* Keywords List */}
              {availableKeywords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No available keywords found.</p>
                  <Link href="/dashboard/keywords" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
                    Add keywords →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableKeywords.map((keyword: any) => (
                    <motion.div
                      key={keyword.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{keyword.keyword}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {keyword.searchVolume && (
                              <span>Volume: {keyword.searchVolume.toLocaleString()}</span>
                            )}
                            {keyword.difficulty !== null && (
                              <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(keyword.difficulty)}`}>
                                Difficulty: {keyword.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleGenerateBlog(keyword.id, keyword.keyword)}
                          disabled={isGenerating && selectedKeyword === keyword.id}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isGenerating && selectedKeyword === keyword.id ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Generating...
                            </span>
                          ) : (
                            'Generate Blog'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Generated Blog Posts */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Generated Blog Posts</h2>
              
              {generatedBlogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-2">No blog posts generated yet.</p>
                  <p className="text-sm">Select a keyword from the left to generate your first blog post!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {generatedBlogs.map((blog: any) => (
                    <motion.div
                      key={blog.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{blog.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${
                              blog.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {blog.status}
                            </span>
                          </div>
                          {blog.metaDescription && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{blog.metaDescription}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {blog.wordCount && <span>{blog.wordCount.toLocaleString()} words</span>}
                            {blog.seoScore && (
                              <span className={`px-2 py-1 rounded ${
                                blog.seoScore >= 80 ? 'bg-green-100 text-green-700' :
                                blog.seoScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                SEO: {blog.seoScore}
                              </span>
                            )}
                            {blog.createdAt && (
                              <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2">
                          <Link
                            href={`/blog/${blog.id}`}
                            className="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                          >
                            View Blog
                          </Link>
                          <Link
                            href={`/dashboard/articles/${blog.id}`}
                            className="px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

