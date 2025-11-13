'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState([
    { label: 'Total Articles', value: '0', change: '+0', trend: 'up' },
    { label: 'Published', value: '0', change: '+0', trend: 'up' },
    { label: 'Keywords', value: '0', change: '+0', trend: 'up' },
    { label: 'Backlinks', value: '0', change: '+0', trend: 'up' },
  ]);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[Dashboard] Not authenticated, redirecting to login');
      console.log('[Dashboard] Auth loading:', authLoading, 'Is authenticated:', isAuthenticated);
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadDashboard() {
      // Don't load if not authenticated
      if (!isAuthenticated) {
        return;
      }

      try {
        // Get first project
        const projectsRes = await apiGet('/api/projects');
        if (projectsRes.error || !projectsRes.data?.projects || projectsRes.data.projects.length === 0) {
          router.push('/onboarding');
          return;
        }

        const project = projectsRes.data.projects[0];

        // Get articles
        const articlesRes = await apiGet(`/api/articles?projectId=${project.id}`);
        const articles = articlesRes.data?.articles || [];

        // Get keywords
        const keywordsRes = await apiGet(`/api/keywords?projectId=${project.id}`);
        const keywords = keywordsRes.data?.keywords || [];

        // Get backlinks
        const backlinksRes = await apiGet(`/api/backlinks?projectId=${project.id}`);
        const backlinks = backlinksRes.data?.backlinks || [];

        // Update stats
        const published = articles.filter((a: any) => a.status === 'published').length;
        setStats([
          { label: 'Total Articles', value: articles.length.toString(), change: '+0', trend: 'up' },
          { label: 'Published', value: published.toString(), change: '+0', trend: 'up' },
          { label: 'Keywords', value: keywords.length.toString(), change: '+0', trend: 'up' },
          { label: 'Backlinks', value: backlinks.length.toString(), change: '+0', trend: 'up' },
        ]);

        // Set recent articles
        setRecentArticles(
          articles.slice(0, 3).map((a: any) => ({
            title: a.title,
            status: a.status.charAt(0).toUpperCase() + a.status.slice(1),
            date: new Date(a.createdAt).toLocaleDateString(),
            id: a.id,
          }))
        );
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAuthenticated) {
      loadDashboard();
    }
  }, [router, isAuthenticated]);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome back! Here's what's happening with your SEO.</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-green-600 font-semibold">
                  {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Articles */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Articles</h2>
              <Link href="/dashboard/articles" className="text-blue-600 hover:text-blue-700 text-sm">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentArticles.map((article, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{article.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded ${
                        article.status === 'Published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {article.status}
                      </span>
                      <span>{article.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href="/onboarding"
                className="block w-full bg-green-600 text-white text-center py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Setup New Project
              </Link>
              <Link
                href="/dashboard/articles/new"
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create New Article
              </Link>
              <Link
                href="/dashboard/keywords"
                className="block w-full bg-gray-100 text-gray-900 text-center py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Add Keywords
              </Link>
              <Link
                href="/dashboard/calendar"
                className="block w-full bg-gray-100 text-gray-900 text-center py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                View Calendar
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
