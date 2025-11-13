'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { apiGet } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function OnboardingResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const projectId = searchParams.get('projectId');
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch project data - Always fetch when projectId changes
  useEffect(() => {
    async function fetchProject() {
      if (!projectId || !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setProject(null);
        setError(null);
        
        const cacheBuster = Date.now();
        const response = await apiGet(`/api/projects/${projectId}?t=${cacheBuster}&_=${cacheBuster}`);
        
        if (response.error) {
          if (response.error.includes('Unauthorized') || response.error.includes('Authentication required')) {
            router.push('/login');
            return;
          }
          setError(response.error);
          setProject(null);
        } else if (response.data?.project) {
          setProject(response.data.project);
          setError(null);
        } else {
          setError('Project not found');
          setProject(null);
        }
      } catch (err: any) {
        console.error('[Onboarding Results] Failed to fetch project:', err);
        setError(err.message || 'Failed to load project');
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProject();
  }, [projectId, isAuthenticated, router]);

  // Show loading while checking auth
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          {error && (
            <p className="text-red-600">{error}</p>
          )}
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const brandAnalysis = project.brandAnalysis as any;
  const seoAnalysis = project.seoAnalysis as any;
  const competitorData = project.competitorData as any[];

  // Calculate SEO score
  const calculateSEOScore = () => {
    if (!seoAnalysis) return 0;
    let score = 0;
    if (seoAnalysis.title) score += 15;
    if (seoAnalysis.metaDescription) score += 15;
    if (seoAnalysis.h1Count && seoAnalysis.h1Count > 0) score += 10;
    if (seoAnalysis.h2Count && seoAnalysis.h2Count > 0) score += 10;
    const totalImages = (seoAnalysis.imagesWithAlt || 0) + (seoAnalysis.imagesWithoutAlt || 0);
    if (totalImages > 0) {
      const altRatio = (seoAnalysis.imagesWithAlt || 0) / totalImages;
      score += altRatio * 20;
    }
    if (seoAnalysis.wordCount && seoAnalysis.wordCount > 300) score += 15;
    if (seoAnalysis.hasSchema) score += 15;
    return Math.min(100, Math.round(score));
  };

  const seoScore = calculateSEOScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Analysis Complete!</h1>
          <p className="text-lg text-gray-600">
            We've analyzed your website and discovered valuable insights to help improve your SEO.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/80">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-sm font-mono text-gray-700">{project.websiteUrl}</span>
          </div>
        </motion.div>

        {/* SEO Score Card */}
        {seoAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className={`bg-white' ')[2]} p-8`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">SEO Score</h2>
                  <p className="text-gray-600">Overall website SEO performance</p>
                </div>
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - seoScore / 100)}`}
                      className={seoScore >= 80 ? 'text-green-600' : seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-4xl font-bold ${seoScore >= 80 ? 'text-green-600' : seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {seoScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Brand Analysis */}
          {brandAnalysis && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Brand Analysis</h2>
                </div>

                <div className="space-y-6">
                  {/* Logo */}
                  {brandAnalysis.logo && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">Logo</h3>
                      <div className="bg-gray-50">
                        <img
                          src={brandAnalysis.logo}
                          alt="Brand logo"
                          className="max-h-16 max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {brandAnalysis.colors && brandAnalysis.colors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">Color Palette</h3>
                      <div className="flex flex-wrap gap-3">
                        {brandAnalysis.colors.slice(0, 10).map((color: string, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.05 }}
                            className="group relative"
                          >
                            <div
                              className="w-14 h-14 rounded-xl border-2 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {color}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {brandAnalysis.primaryColor && (
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-sm text-gray-600">Primary Color:</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-gray-300"
                              style={{ backgroundColor: brandAnalysis.primaryColor }}
                            />
                            <code className="text-sm font-mono bg-gray-100">
                              {brandAnalysis.primaryColor}
                            </code>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fonts */}
                  {brandAnalysis.fonts && brandAnalysis.fonts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500">Typography</h3>
                      <div className="space-y-2">
                        {brandAnalysis.fonts.slice(0, 5).map((font: string, i: number) => (
                          <div
                            key={i}
                            className="bg-gray-50"
                            style={{ fontFamily: font }}
                          >
                            <div className="text-sm text-gray-600">{font}</div>
                            <div className="text-lg font-medium text-gray-900">
                              The quick brown fox jumps over the lazy dog
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* SEO Status */}
          {seoAnalysis && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">SEO Status</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="bg-gradient-to-br from-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="text-xs font-semibold text-blue-600">Title</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {seoAnalysis.title || 'Not set'}
                    </div>
                  </div>

                  {/* Meta Description */}
                  <div className="bg-gradient-to-br from-purple-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className="text-xs font-semibold text-purple-600">Meta Description</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {seoAnalysis.metaDescription || 'Not set'}
                    </div>
                  </div>

                  {/* Word Count */}
                  <div className="bg-gradient-to-br from-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-green-600">Word Count</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {seoAnalysis.wordCount?.toLocaleString() || 0}
                    </div>
                  </div>

                  {/* H1 Headings */}
                  <div className="bg-gradient-to-br from-orange-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14M5 7h14" />
                      </svg>
                      <span className="text-xs font-semibold text-orange-600">H1 Headings</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{seoAnalysis.h1Count || 0}</div>
                  </div>

                  {/* H2 Headings */}
                  <div className="bg-gradient-to-br from-pink-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14M5 7h14" />
                      </svg>
                      <span className="text-xs font-semibold text-pink-600">H2 Headings</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{seoAnalysis.h2Count || 0}</div>
                  </div>

                  {/* Images with Alt */}
                  <div className="bg-gradient-to-br from-cyan-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-cyan-600">Images with Alt</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {seoAnalysis.imagesWithAlt || 0}
                      <span className="text-sm font-normal text-gray-600">
                        {' '}/{' '}
                        {(seoAnalysis.imagesWithAlt || 0) + (seoAnalysis.imagesWithoutAlt || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Internal Links */}
                  <div className="bg-gradient-to-br from-indigo-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-xs font-semibold text-indigo-600">Internal Links</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{seoAnalysis.internalLinks || 0}</div>
                  </div>

                  {/* External Links */}
                  <div className="bg-gradient-to-br from-teal-50">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="text-xs font-semibold text-teal-600">External Links</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{seoAnalysis.externalLinks || 0}</div>
                  </div>

                  {/* Schema Markup */}
                  <div className={`rounded-xl p-4 border-2 ${seoAnalysis.hasSchema ? 'bg-gradient-to-br from-green-50' : 'bg-gradient-to-br from-gray-50'} col-span-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 ${seoAnalysis.hasSchema ? 'text-green-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${seoAnalysis.hasSchema ? 'text-green-600' : 'text-gray-600'}`}>
                          Schema Markup
                        </span>
                      </div>
                      <div className={`text-lg font-bold ${seoAnalysis.hasSchema ? 'text-green-600' : 'text-gray-600'}`}>
                        {seoAnalysis.hasSchema ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Competitors */}
        {competitorData && competitorData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Competitor Analysis</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {competitorData.map((competitor: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    className="bg-gradient-to-br from-gray-50"
                  >
                    <h3 className="font-semibold text-gray-900">{competitor.url}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Title:</span>
                        <span className="font-medium text-gray-900">
                          {competitor.title || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Word Count:</span>
                        <span className="font-medium text-gray-900">
                          {competitor.wordCount?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/dashboard"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/dashboard/keywords"
            className="w-full sm:w-auto bg-white"
          >
            View Keywords
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
