'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiGet, apiPatch } from '@/lib/api-client';
import { analyzeSEO } from '@/lib/services/seo-analyzer';

export default function ArticleEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState<any>(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    async function loadArticle() {
      try {
        const response = await apiGet(`/api/articles/${id}`);
        if (response.error) {
          console.error('Failed to load article:', response.error);
          return;
        }

        if (response.data?.article) {
          const articleData = response.data.article;
          setArticle(articleData);
          setTitle(articleData.title);
          setContent(articleData.content);
          setMetaTitle(articleData.metaTitle || '');
          setMetaDescription(articleData.metaDescription || '');
          setKeyword(articleData.keyword?.keyword || '');
          
          // Calculate SEO analysis
          const keywordText = articleData.keyword?.keyword || '';
          const analysis = analyzeSEO(
            articleData.content,
            articleData.metaTitle || articleData.title,
            articleData.metaDescription || '',
            keywordText
          );
          setSeoAnalysis(analysis);
        }
      } catch (error) {
        console.error('Failed to load article:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadArticle();
  }, [id]);

  // Recalculate SEO analysis when content changes
  useEffect(() => {
    if (article && content) {
      const keywordText = article.keyword?.keyword || '';
      const analysis = analyzeSEO(
        content,
        metaTitle || title,
        metaDescription || '',
        keywordText
      );
      setSeoAnalysis(analysis);
    }
  }, [content, metaTitle, metaDescription, title, article]);

  const handleSave = async () => {
    if (!article) return;

    setIsSaving(true);
    try {
      const response = await apiPatch(`/api/articles/${article.id}`, {
        title,
        content,
        metaTitle,
        metaDescription,
      });

      if (response.error) {
        // Error toast is shown automatically by apiPatch
        return;
      }

      try {
        const toast = await import('@/lib/utils/toast');
        toast.showSuccess('Article saved successfully!');
      } catch (e) {
        console.log('Article saved successfully!');
      }
    } catch (error: any) {
      try {
        const toast = await import('@/lib/utils/toast');
        toast.handleAPIError(error);
      } catch (e) {
        console.error('Failed to save article:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status: 'draft' | 'scheduled' | 'published') => {
    if (!article) return;

    setIsUpdatingStatus(true);
    try {
      const updateData: any = { status };
      if (status === 'published') {
        updateData.publishedAt = new Date().toISOString();
      }

      const response = await apiPatch(`/api/articles/${article.id}`, updateData);

      if (response.error) {
        // Error toast is shown automatically by apiPatch
        return;
      }

      setArticle({ ...article, status, ...updateData });
      
      const toast = await import('@/lib/utils/toast');
      
      if (status === 'published') {
        const checkIntegration = async () => {
          try {
            const projectsRes = await apiGet('/api/projects');
            if (projectsRes.data?.projects?.[0]) {
              const project = projectsRes.data.projects[0];
              const integrationsRes = await apiGet(`/api/integrations?projectId=${project.id}`);
              const integrations = integrationsRes.data?.integrations || [];
              const wpIntegration = integrations.find((i: any) => i.platform === 'wordpress' && i.isActive);
              
              if (wpIntegration) {
                const credentials = wpIntegration.credentials as any || {};
                const hasKey = !!wpIntegration.integrationKey;
                const hasUrl = !!credentials.url;
                
                if (hasKey && hasUrl) {
                  toast.showSuccess('Article published! It has been automatically published to your WordPress site.');
                } else {
                  toast.showWarning(`Article published! WordPress integration is active but missing ${!hasKey ? 'integration key' : 'WordPress URL'}.`);
                }
              } else {
                toast.showSuccess('Article published! Note: WordPress integration is not active.');
              }
            } else {
              toast.showSuccess('Article published!');
            }
          } catch {
            toast.showSuccess('Article published!');
          }
        };
        checkIntegration();
      } else {
        toast.showSuccess(`Article status updated to ${status}!`);
      }
      
      router.refresh();
    } catch (error: any) {
      const toast = await import('@/lib/utils/toast');
      toast.handleAPIError(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Convert markdown to HTML for display
  const markdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*)$/gim, '<h3 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*)$/gim, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.*)$/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-10 mb-6">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-700 underline">$1</a>');
    
    // Paragraphs
    const lines = html.split('\n');
    const processed: string[] = [];
    let currentPara: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/^<(h[1-6]|ul|li)/)) {
        if (currentPara.length > 0) {
          processed.push(`<p class="text-gray-700 mb-4 leading-relaxed">${currentPara.join(' ')}</p>`);
          currentPara = [];
        }
        processed.push(line);
      } else if (line === '') {
        if (currentPara.length > 0) {
          processed.push(`<p class="text-gray-700 mb-4 leading-relaxed">${currentPara.join(' ')}</p>`);
          currentPara = [];
        }
      } else {
        currentPara.push(line);
      }
    }
    
    if (currentPara.length > 0) {
      processed.push(`<p class="text-gray-700 mb-4 leading-relaxed">${currentPara.join(' ')}</p>`);
    }
    
    return processed.join('\n');
  };

  // Calculate individual scores
  const calculateScores = () => {
    if (!seoAnalysis) return { headings: 100, structure: 100, terms: 100 };
    
    // Headings score (based on heading count and structure)
    const headingsScore = seoAnalysis.headingCount >= 3 ? 100 : Math.max(0, seoAnalysis.headingCount * 33);
    
    // Structure score (based on word count, paragraphs, links)
    let structureScore = 100;
    if (seoAnalysis.wordCount < 1000) structureScore -= 20;
    if (seoAnalysis.paragraphCount < 5) structureScore -= 15;
    if (seoAnalysis.internalLinks < 3) structureScore -= 10;
    if (seoAnalysis.externalLinks < 1) structureScore -= 5;
    structureScore = Math.max(0, Math.min(100, structureScore));
    
    // Terms score (based on keyword density and usage)
    let termsScore = 100;
    const density = parseFloat(seoAnalysis.keywordDensity) || 0;
    if (density < 0.5) termsScore -= 20;
    if (density > 2) termsScore -= 15;
    if (!keyword || keyword.trim() === '') termsScore = 0;
    termsScore = Math.max(0, Math.min(100, termsScore));
    
    return {
      headings: Math.round(headingsScore),
      structure: Math.round(structureScore),
      terms: Math.round(termsScore),
    };
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <Link href="/dashboard/articles" className="text-blue-600 hover:text-blue-700">
            ← Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const scores = calculateScores();
  const overallScore = Math.round((scores.headings + scores.structure + scores.terms) / 3);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/articles"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Exit</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-sm text-gray-600">
              Article: {keyword || 'No keyword'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <select
              value={article.status}
              onChange={(e) => handleStatusChange(e.target.value as 'draft' | 'scheduled' | 'published')}
              disabled={isUpdatingStatus}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-sm font-medium bg-white"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Article Editor */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-bold text-gray-900 mb-6 border-none outline-none focus:ring-0 p-0"
              placeholder="Article Title"
            />

            {/* Content Editor */}
            <div className="prose prose-lg max-w-none">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={30}
                className="w-full border-none outline-none focus:ring-0 p-0 font-sans text-gray-700 leading-relaxed resize-none"
                placeholder="Write your article content here in Markdown format..."
                style={{ minHeight: '600px' }}
              />
            </div>

            {/* Preview (optional - can be toggled) */}
            {content && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Analytics Sidebar */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto sticky top-0 h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Article</h2>

            {/* Article Score */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#10b981"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(overallScore / 100) * 351.86} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">{overallScore}</div>
                      <div className="text-sm text-gray-500">/100</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Headings:</span>
                  <span className="font-semibold text-gray-900">{scores.headings}/100</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Structure:</span>
                  <span className="font-semibold text-gray-900">{scores.structure}/100</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Terms:</span>
                  <span className="font-semibold text-gray-900">{scores.terms}/100</span>
                </div>
              </div>
            </div>

            {/* Keyword Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Keyword</label>
              <input
                type="text"
                value={keyword}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm"
              />
              {article.keyword && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-gray-600">
                    Search volume: ~{article.keyword.searchVolume?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">
                    Difficulty: {article.keyword.difficulty || 'N/A'}
                  </div>
                </div>
              )}
            </div>

            {/* Structure Section */}
            {seoAnalysis && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Structure</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Words:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {seoAnalysis.wordCount?.toLocaleString() || 0}
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Headings:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {seoAnalysis.headingCount || 0}
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Paragraphs:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {seoAnalysis.paragraphCount || 0}
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Keyword density:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {typeof seoAnalysis.keywordDensity === 'number' 
                        ? seoAnalysis.keywordDensity.toFixed(1) 
                        : parseFloat(seoAnalysis.keywordDensity || '0').toFixed(1)}%
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Internal links:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {seoAnalysis.internalLinks || 0}
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">External links:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      {seoAnalysis.externalLinks || 0}
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Header Image Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Header image</label>
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center p-4">
                <h3 className="text-white font-bold text-lg text-center">{title || 'Article Title'}</h3>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-6">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(content);
                  const toast = await import('@/lib/utils/toast');
                  toast.showSuccess('Article content copied to clipboard!');
                }}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center justify-between"
              >
                <span>Copy article</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={async () => {
                  const metaData = `Title: ${title}\nMeta Title: ${metaTitle}\nMeta Description: ${metaDescription}`;
                  await navigator.clipboard.writeText(metaData);
                  const toast = await import('@/lib/utils/toast');
                  toast.showSuccess('Meta data copied to clipboard!');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-between"
              >
                <span>Copy meta data</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
