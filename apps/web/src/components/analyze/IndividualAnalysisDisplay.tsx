'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { AnalysisResult } from '@/types/analyze';
import { formatScore, getScoreColor } from '@/lib/analyze-utils';
import { Button } from '@/components/ui/button';

interface IndividualAnalysisDisplayProps {
  analysis: AnalysisResult;
  onBackToSummary?: () => void;
  showBackButton?: boolean;
}

export function IndividualAnalysisDisplay({
  analysis,
  onBackToSummary,
  showBackButton = false,
}: IndividualAnalysisDisplayProps) {
  if (!analysis?.data) return null;

  const { data } = analysis;

  return (
    <div className="space-y-8">
      {/* Back to Summary Button */}
      {showBackButton && onBackToSummary && (
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToSummary}
          className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
        >
          ← Back to All Repositories Summary
        </Button>
      )}

      {/* Repository Overview */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          {data.repository.full_name}
        </h2>
        <p className="text-gray-600 text-lg mb-6">
          {data.repository.description || "No description available"}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ⭐ {data.repository.stars}
            </div>
            <div className="text-gray-600">Stars</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              🍴 {data.repository.forks}
            </div>
            <div className="text-gray-600">Forks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {data.repository.language || "N/A"}
            </div>
            <div className="text-gray-600">Primary Language</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {(data.repository.size / 1024).toFixed(1)}MB
            </div>
            <div className="text-gray-600">Repository Size</div>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Overall Analysis Score
        </h2>
        <div className="text-center">
          <div
            className={`text-7xl font-bold ${getScoreColor(data.overall_score)} mb-4`}
          >
            {formatScore(data.overall_score)}
          </div>
          <div className="text-2xl text-gray-600 mb-6">out of 100</div>
          <div className="text-lg text-gray-600">
            Analysis completed in {data.analysis_duration.toFixed(2)} seconds
          </div>
        </div>
      </div>

      {/* Code Metrics */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Code Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <div className="text-4xl font-bold text-blue-600 mb-3">
              {data.metrics.lines_of_code.toLocaleString()}
            </div>
            <div className="text-gray-700 font-medium">Lines of Code</div>
            <div className="text-sm text-gray-500 mt-1">
              {data.metrics.files_analyzed} files analyzed
            </div>
          </div>
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <div className="text-4xl font-bold text-green-600 mb-3">
              {formatScore(data.metrics.maintainability)}
            </div>
            <div className="text-gray-700 font-medium">Maintainability</div>
            <div className="text-sm text-gray-500 mt-1">
              Code structure quality
            </div>
          </div>
          <div className="text-center p-6 bg-orange-50 rounded-xl">
            <div className="text-4xl font-bold text-orange-600 mb-3">
              {formatScore(data.metrics.complexity)}
            </div>
            <div className="text-gray-700 font-medium">Complexity</div>
            <div className="text-sm text-gray-500 mt-1">
              Cyclomatic complexity
            </div>
          </div>
        </div>
      </div>

      {/* Quality & Security Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quality Metrics */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Quality Metrics
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-700">
                Documentation Coverage
              </span>
              <span
                className={`text-3xl font-bold ${getScoreColor(data.quality.documentation_coverage)} mb-3`}
              >
                {formatScore(data.quality.documentation_coverage)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-700">
                Architecture Score
              </span>
              <span
                className={`text-3xl font-bold ${getScoreColor(data.quality.architecture_score)} mb-3`}
              >
                {formatScore(data.quality.architecture_score)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="font-medium text-gray-700">Test Files</span>
              <span className="text-2xl font-bold text-gray-700">
                {data.quality.test_files}
              </span>
            </div>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Security Analysis
          </h3>
          <div className="space-y-6">
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <div
                className={`text-3xl font-bold ${getScoreColor(data.security.security_score)} mb-3`}
              >
                {formatScore(data.security.security_score)}
              </div>
              <div className="text-gray-700 font-medium">Security Score</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-xl">
                <div className="text-2xl font-bold text-yellow-600 mb-2">
                  {data.security.critical_issues}
                </div>
                <div className="text-sm text-gray-600">Critical Issues</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600 mb-2">
                  {data.security.security_hotspots}
                </div>
                <div className="text-sm text-gray-600">Security Hotspots</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {data.ai_insights && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">AI Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Code Assessment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {data.ai_insights.code_assessment}
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Architecture Assessment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {data.ai_insights.architecture_assessment}
              </p>
            </div>
          </div>
          
          {data.ai_insights.strengths && data.ai_insights.strengths.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Key Strengths
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.ai_insights.strengths.map((strength, index) => (
                  <div
                    key={index}
                    className="p-4 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Project Summary
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          {data.project_summary}
        </p>
      </div>

      {/* Files Discovered */}
      {data.files_discovered && data.files_discovered.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Files Analyzed ({data.files_discovered.length})
          </h2>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.files_discovered.map((file, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    file.analyzed
                      ? "bg-green-50 text-green-800"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{file.analyzed ? "✓" : "○"}</span>
                    <span className="font-mono">{file.path}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
