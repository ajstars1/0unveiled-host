'use client';

import { AnalysisResult, OverallInsights } from '@/types/analyze';
import { generateOverallInsights } from '@/lib/generateOverallInsights';
import { formatScore, getScoreColor } from '@/lib/analyze-utils';

interface BulkAnalysisDisplayProps {
  allAnalyses: { [key: string]: AnalysisResult };
  onSelectRepository?: (repoName: string) => void;
}

export function BulkAnalysisDisplay({
  allAnalyses,
  onSelectRepository,
}: BulkAnalysisDisplayProps) {
  const overallInsights = generateOverallInsights(allAnalyses);
  
  if (!overallInsights) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4">
          Analysis Results
        </h3>
        <p className="text-gray-600">
          Need at least 2 repositories to generate overall insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overall Portfolio Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Portfolio Analysis Summary
        </h2>
        <div className="text-center mb-8">
          <div
            className={`text-6xl font-bold ${getScoreColor(overallInsights.overallScore)} mb-3`}
          >
            {overallInsights.overallScore}
          </div>
          <div className="text-2xl text-gray-600 mb-2">
            Overall Portfolio Score
          </div>
          <div className="text-lg text-gray-500">
            Based on {overallInsights.repoCount} repositories
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <div className="text-4xl font-bold text-blue-600 mb-3">
              {overallInsights.totalLinesOfCode.toLocaleString()}
            </div>
            <div className="text-gray-700 font-medium">Total Lines of Code</div>
            <div className="text-sm text-gray-500 mt-1">
              Across all repositories
            </div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <div className="text-4xl font-bold text-green-600 mb-3">
              {overallInsights.topLanguages.length}
            </div>
            <div className="text-gray-700 font-medium">Programming Languages</div>
            <div className="text-sm text-gray-500 mt-1">
              Primary languages used
            </div>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-xl">
            <div
              className={`text-2xl font-bold ${getScoreColor(overallInsights.avgSecurity)} mb-1`}
            >
              {overallInsights.avgSecurity}
            </div>
            <div className="text-gray-700 font-medium">Average Security Score</div>
            <div className="text-sm text-gray-500 mt-1">
              Across all projects
            </div>
          </div>
        </div>
      </div>

      {/* Developer Insights */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Developer Profile Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Key Insights
            </h3>
            <div className="space-y-3">
              {overallInsights.insights.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 mt-0.5">💡</span>
                    <span className="text-gray-700">{insight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Project Types
            </h3>
            <div className="space-y-2">
              {overallInsights.projectTypes.map((type, index) => (
                <div
                  key={index}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <span className="text-green-700 font-medium">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Language Distribution */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Language Distribution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {overallInsights.topLanguages.map((lang, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="font-semibold text-gray-800">{lang.language}</div>
                <div className="text-sm text-gray-600">
                  {lang.count} repositories ({lang.percentage}%)
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {lang.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Repository Results */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Individual Repository Results
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(allAnalyses).map(([repoName, analysis]) => (
            <div
              key={repoName}
              className="p-6 border border-gray-200 rounded-xl hover:border-gray-400 transition-all cursor-pointer"
              onClick={() => onSelectRepository?.(repoName)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg truncate">
                  {repoName.split('/')[1]}
                </h3>
                <div
                  className={`text-2xl font-bold ${getScoreColor(analysis.data.overall_score)}`}
                >
                  {formatScore(analysis.data.overall_score)}
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {analysis.data.repository.description || "No description"}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{analysis.data.repository.language}</span>
                <span
                  className={`font-medium ${getScoreColor(analysis.data.security.security_score)}`}
                >
                  Security: {formatScore(analysis.data.security.security_score)}
                </span>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                {analysis.data.metrics.lines_of_code.toLocaleString()} lines • 
                {analysis.data.metrics.files_analyzed} files
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
