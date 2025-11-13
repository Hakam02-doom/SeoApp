'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api-client';

export default function NewArticlePage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(2000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await apiGet('/api/projects');
        if (response.data?.projects && response.data.projects.length > 0) {
          setProject(response.data.projects[0]);
        }
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProject();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !keyword.trim()) return;

    setIsGenerating(true);
    try {
      const response = await apiPost('/api/articles/generate', {
        projectId: project.id,
        keyword: keyword.trim(),
        targetWordCount,
      });

      if (response.error) {
        alert(response.error || 'Failed to generate article');
        setIsGenerating(false);
        return;
      }

      if (response.data?.article) {
        router.push(`/dashboard/articles/${response.data.article.id}`);
      } else {
        alert('Article generated but no article data returned');
        setIsGenerating(false);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to generate article');
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Article</h1>

      <form onSubmit={handleGenerate} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Keyword *
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., seo automation tools"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the main keyword you want this article to rank for
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Word Count
          </label>
          <input
            type="number"
            value={targetWordCount}
            onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 2000)}
            min={500}
            max={10000}
            step={100}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Recommended: 1,500-2,500 words for best SEO results
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isGenerating || !keyword.trim() || !project}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isGenerating ? 'Generating Article...' : 'Generate Article'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        {!project && (
          <p className="text-sm text-yellow-600">
            Please set up your project in Settings first
          </p>
        )}
      </form>
    </div>
  );
}
