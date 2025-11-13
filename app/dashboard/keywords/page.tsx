'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';

export default function KeywordsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'unplanned' | 'planned' | 'used' | undefined>(undefined);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [keywords, setKeywords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function loadKeywords() {
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
          if (searchQuery) {
            params.append('search', searchQuery);
          }

          const keywordsRes = await apiGet(`/api/keywords?${params.toString()}`);
          setKeywords(keywordsRes.data?.keywords || []);
        }
      } catch (error) {
        console.error('Failed to load keywords:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadKeywords();
  }, [statusFilter, searchQuery]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !projectId) return;

    try {
      const response = await apiPost('/api/keywords', {
        projectId,
        keyword: newKeyword.trim(),
        status: 'unplanned',
      });

      if (response.error) {
        // Error toast is shown automatically by apiPost
        return;
      }

      setShowAddModal(false);
      setNewKeyword('');
      // Reload keywords
      const keywordsRes = await apiGet(`/api/keywords?projectId=${projectId}`);
      setKeywords(keywordsRes.data?.keywords || []);
      
      try {
        const toast = await import('@/lib/utils/toast');
        toast.showSuccess('Keyword added successfully!');
      } catch (e) {
        console.log('Keyword added successfully!');
      }
    } catch (error: any) {
      try {
        const toast = await import('@/lib/utils/toast');
        toast.handleAPIError(error);
      } catch (e) {
        console.error('Failed to add keyword:', error);
      }
    }
  };

  const handleStar = async (keywordId: string, starred: boolean) => {
    if (!projectId) return;

    try {
      await apiPatch(`/api/keywords/${keywordId}`, { starred });
      // Reload keywords
      const keywordsRes = await apiGet(`/api/keywords?projectId=${projectId}`);
      setKeywords(keywordsRes.data?.keywords || []);
    } catch (error) {
      console.error('Failed to star keyword:', error);
    }
  };

  const handlePlan = async (keywordId: string, plannedDate: string | null) => {
    if (!projectId) return;

    try {
      await apiPatch(`/api/keywords/${keywordId}`, {
        plannedDate: plannedDate,
        status: plannedDate ? 'planned' : 'unplanned',
      });
      // Reload keywords
      const keywordsRes = await apiGet(`/api/keywords?projectId=${projectId}`);
      setKeywords(keywordsRes.data?.keywords || []);
    } catch (error) {
      console.error('Failed to plan keyword:', error);
    }
  };

  const handleGeneratePlan = async (replaceExisting: boolean) => {
    if (!projectId) return;

    setIsGeneratingPlan(true);
    try {
      const response = await apiPost('/api/keywords/generate-plan', {
        projectId,
        replaceExisting,
      });

      if (response.error) {
        // Error toast is shown automatically by apiPost
        return;
      }

      setShowPlanModal(false);
      // Reload keywords
      const keywordsRes = await apiGet(`/api/keywords?projectId=${projectId}`);
      setKeywords(keywordsRes.data?.keywords || []);
      
      // Show success message
      try {
        const toast = await import('@/lib/utils/toast');
        toast.showSuccess(`Successfully generated ${response.data?.plan?.keywordsCreated || 0} keywords for your 30-day plan!`);
      } catch (e) {
        console.log(`Successfully generated ${response.data?.plan?.keywordsCreated || 0} keywords!`);
      }
    } catch (error: any) {
      try {
        const toast = await import('@/lib/utils/toast');
        toast.handleAPIError(error);
      } catch (e) {
        console.error('Failed to generate keyword plan:', error);
      }
    } finally {
      setIsGeneratingPlan(false);
    }
  };
  
  // Calculate stats
  const stats = [
    { label: 'All keywords', value: keywords.length },
    { label: 'Starred', value: keywords.filter((k: any) => k.starred).length },
    { label: 'Planned', value: keywords.filter((k: any) => k.status === 'planned').length },
    { label: 'Unplanned', value: keywords.filter((k: any) => k.status === 'unplanned').length },
    { label: 'Used', value: keywords.filter((k: any) => k.status === 'used').length },
  ];

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 20) return 'bg-green-100 text-green-700';
    if (difficulty < 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-100 text-orange-700';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              Keywords
              <span className="text-gray-400 text-xl">ℹ️</span>
            </h1>
            <p className="text-gray-600">
              All high-impact keywords that will be planned to boost your SEO, this list will automatically be expanded.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPlanModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate 30-Day Plan
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Add keywords
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="text-sm text-gray-600 mb-1">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-gray-900"
            />
          </div>
        </div>

        {/* Status Filters */}
        <div className="mb-4 flex gap-2">
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
            onClick={() => setStatusFilter('unplanned')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'unplanned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unplanned
          </button>
          <button
            onClick={() => setStatusFilter('planned')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'planned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Planned
          </button>
          <button
            onClick={() => setStatusFilter('used')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === 'used'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Used
          </button>
        </div>

        {/* Keywords Table */}
        {isLoading ? (
          <div className="text-center py-12">Loading keywords...</div>
        ) : keywords.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No keywords found. Add your first keyword to get started!
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Keyword</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Search volume</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Difficulty</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Planned</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {keywords.map((item: any, index: number) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStar(item.id, !item.starred)}
                          className={item.starred ? 'text-yellow-500' : 'text-gray-400'}
                        >
                          ⭐
                        </button>
                        <span className="font-medium text-gray-900">{item.keyword}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.searchVolume ? item.searchVolume.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {item.difficulty !== null ? (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(item.difficulty)}`}>
                          {item.difficulty}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.status === 'used' ? 'bg-green-100 text-green-700' :
                        item.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.plannedDate ? new Date(item.plannedDate).toLocaleDateString() : 'Not planned'}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600">⋯</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Generate Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Generate 30-Day Keyword Plan</h2>
              <p className="text-gray-600 mb-4">
                This will generate 30-60 SEO-optimized keywords related to your services and distribute them across the next 30 days. Keywords will be based on your website content, services, and competitor analysis.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">What will be generated:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Keywords related to your services</li>
                  <li>• Mix of informational, commercial, and transactional keywords</li>
                  <li>• Keywords distributed across 30 days</li>
                  <li>• Estimated search volume and difficulty scores</li>
                  <li>• Strategic progression from easy to competitive keywords</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGeneratePlan(false)}
                  disabled={isGeneratingPlan || !projectId}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
                </button>
                <button
                  onClick={() => handleGeneratePlan(true)}
                  disabled={isGeneratingPlan || !projectId}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isGeneratingPlan ? 'Generating...' : 'Replace Existing'}
                </button>
                <button
                  onClick={() => setShowPlanModal(false)}
                  disabled={isGeneratingPlan}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              {isGeneratingPlan && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  This may take 30-60 seconds...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Keyword Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Add Keyword</h2>
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Enter keyword"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newKeyword.trim() && projectId) {
                    handleAddKeyword();
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddKeyword}
                  disabled={!newKeyword.trim() || !projectId}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewKeyword('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
