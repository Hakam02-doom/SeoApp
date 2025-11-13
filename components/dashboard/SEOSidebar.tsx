'use client';

import { SEOAnalysis } from '@/lib/services/seo-analyzer';

interface SEOSidebarProps {
  analysis: SEOAnalysis;
}

export default function SEOSidebar({ analysis }: SEOSidebarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 80) return 'border-green-500';
    if (score >= 60) return 'border-yellow-500';
    return 'border-red-500';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">SEO Analysis</h2>

      {/* SEO Score */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-2">
          <div
            className={`w-24 h-24 rounded-full border-4 ${getScoreBorderColor(
              analysis.score
            )} flex items-center justify-center`}
          >
            <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
              {analysis.score}
            </span>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600">SEO Score</p>
      </div>

      {/* Metrics */}
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Word Count</span>
          <span className="text-sm font-medium text-gray-900">{analysis.wordCount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Headings</span>
          <span className="text-sm font-medium text-gray-900">{analysis.headingCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Paragraphs</span>
          <span className="text-sm font-medium text-gray-900">{analysis.paragraphCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Internal Links</span>
          <span className="text-sm font-medium text-gray-900">{analysis.internalLinks}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">External Links</span>
          <span className="text-sm font-medium text-gray-900">{analysis.externalLinks}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Keyword Density</span>
          <span className="text-sm font-medium text-gray-900">{analysis.keywordDensity}%</span>
        </div>
      </div>

      {/* Issues */}
      {analysis.issues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Issues</h3>
          <div className="space-y-2">
            {analysis.issues.map((issue, index) => (
              <div
                key={index}
                className={`p-2 rounded text-xs ${
                  issue.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : issue.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {issue.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Suggestions</h3>
          <div className="space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <div key={index} className="p-2 rounded bg-gray-50 text-xs text-gray-700">
                💡 {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
