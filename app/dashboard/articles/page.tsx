'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api-client';

export default function ArticlesPage() {
  const [statusFilter, setStatusFilter] = useState<'draft' | 'scheduled' | 'published' | undefined>(undefined);
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function loadArticles() {
      try {
        // Get first project
        const projectsRes = await apiGet('/api/projects');
        if (projectsRes.data?.projects && projectsRes.data.projects.length > 0) {
          const pid = projectsRes.data.projects[0].id;
          setProjectId(pid);

          const params = new URLSearchParams({ projectId: pid });
          if (statusFilter) {
            params.append('status', statusFilter);
          }

          const articlesRes = await apiGet(`/api/articles?${params.toString()}`);
          setArticles(articlesRes.data?.articles || []);
        }
      } catch (error) {
        console.error('Failed to load articles:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadArticles();
  }, [statusFilter]);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Articles</h1>
            <p className="text-gray-600">Manage and view all your published and draft articles.</p>
          </div>
          <Link
            href="/dashboard/articles/new"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Article
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setStatusFilter(undefined)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === undefined
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'draft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'published'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'scheduled'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Scheduled
          </button>
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading articles...</div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No articles found. Create your first article to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {articles.map((article: any, index: number) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl font-bold text-gray-900">{article.title}</h2>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : article.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      {article.keyword && (
                        <>
                          <span>Keyword: <strong>{article.keyword.keyword}</strong></span>
                          <span>•</span>
                        </>
                      )}
                      <span>{article.wordCount?.toLocaleString() || 0} words</span>
                      {article.publishedAt && (
                        <>
                          <span>•</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                          (article.seoScore || 0) >= 80 ? 'border-green-500' :
                          (article.seoScore || 0) >= 60 ? 'border-yellow-500' : 'border-red-500'
                        }`}>
                          <span className={`font-bold ${
                            (article.seoScore || 0) >= 80 ? 'text-green-600' :
                            (article.seoScore || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {article.seoScore || 0}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 ml-2">SEO Score</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/articles/${article.id}`}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
