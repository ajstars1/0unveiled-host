"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import ReactFlow, { Node, Edge, Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams } from 'next/navigation';
import { useAnalysisCacheOnly } from '@/react-query/analysis';

interface AnalysisResult {
  // New backend shape
  repository?: {
    full_name?: string;
    description?: string;
    stars?: number;
    forks?: number;
    language?: string;
    size?: number;
  };
  metrics?: {
    lines_of_code?: number;
    total_lines?: number;
    complexity?: number; // cyclomatic complexity
    maintainability?: number;
    technical_debt?: number;
    files_analyzed?: number;
  };
  quality?: {
    documentation_coverage?: number;
    architecture_score?: number;
    test_files?: number;
  };
  security?: {
    security_score?: number;
    critical_issues?: string[];
    security_hotspots?: string[];
  };
  // Legacy/alternate keys used by previous UI (kept optional for compatibility)
  repository_info?: any;
  code_metrics?: any;
  quality_metrics?: any;
  security_analysis?: any;
  technology_stack?: any;
  commit_analysis?: any;
  // Common
  ai_insights?: {
    overall_score?: number;
    code_assessment?: string;
    architecture_assessment?: string;
    maintainability_assessment?: string;
    improvement_areas?: string;
    strengths?: string[];
    project_maturity?: string;
  };
  overall_score?: number;
}

const ResultsPage = () => {
  const params = useParams<{ username: string; repo: string }>();
  const decoded = useMemo(() => decodeURIComponent(params.repo), [params.repo]);
  const [owner, repo] = useMemo(() => (decoded.includes('/') ? decoded.split('/') : [params.username, decoded]), [decoded, params.username]);
  const { data } = useAnalysisCacheOnly();
  const analysisData = (data as unknown as AnalysisResult) || null;

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 text-lg">No analysis data found.</p>
          <p className="text-gray-500 text-sm mt-2">Please run an analysis first.</p>
        </div>
      </div>
    );
  }

  // Extra guard: if for any reason data is still missing, avoid accessing fields
  if (!analysisData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 text-lg">No analysis data found.</p>
          <p className="text-gray-500 text-sm mt-2">Please re-run the analysis from the previous page.</p>
        </div>
      </div>
    );
  }

  // Derived helpers to normalize backend/legacy shapes
  const repoFullName = analysisData.repository?.full_name
    || (analysisData.repository_info?.owner && analysisData.repository_info?.name
      ? `${analysisData.repository_info.owner}/${analysisData.repository_info.name}`
      : undefined);
  const repoLanguage = analysisData.repository?.language || analysisData.repository_info?.language;
  const repoStars = analysisData.repository?.stars ?? analysisData.repository_info?.stars;
  const repoForks = analysisData.repository?.forks ?? analysisData.repository_info?.forks;
  const repoSize = analysisData.repository?.size ?? analysisData.repository_info?.size;

  // Quality metrics mapping
  const maintainability = analysisData.metrics?.maintainability
    ?? analysisData.quality_metrics?.maintainability_index
    ?? 0;
  const documentation = analysisData.quality?.documentation_coverage
    ?? analysisData.code_metrics?.documentation_coverage
    ?? 0;
  const securityScore = analysisData.security?.security_score
    ?? analysisData.security_analysis?.security_score
    ?? 0;
  const filesAnalyzed = analysisData.metrics?.files_analyzed
    ?? analysisData.code_metrics?.total_files
    ?? 0;
  const testFiles = analysisData.quality?.test_files ?? 0;
  const testCoverage = filesAnalyzed > 0 ? Math.min(100, Math.round((testFiles / filesAnalyzed) * 100)) : 0;

  // Helper functions for data visualization
  const getQualityData = () => [
    { name: 'Maintainability', value: Number(maintainability) || 0 },
    { name: 'Test Coverage', value: Number(testCoverage) || 0 },
    { name: 'Documentation', value: Number(documentation) || 0 },
    { name: 'Security Score', value: Number(securityScore) || 0 }
  ];

  const getLanguageData = () => {
    // Prefer legacy languages breakdown if available
    if (analysisData.code_metrics?.languages && analysisData.code_metrics.total_lines) {
      const totalLines = analysisData.code_metrics.total_lines || 1;
      return Object.entries(analysisData.code_metrics.languages).map(([lang, lines]) => ({
        name: String(lang),
        lines: Number(lines),
        percentage: (Number(lines) / totalLines) * 100
      }));
    }
    // Fallback to repository.languages from backend
    const repoLangs = (analysisData.repository as any)?.languages as Record<string, number> | undefined;
    if (repoLangs && Object.keys(repoLangs).length > 0) {
      const total = Object.values(repoLangs).reduce((acc, v) => acc + Number(v || 0), 0) || 1;
      return Object.entries(repoLangs).map(([lang, lines]) => ({
        name: String(lang),
        lines: Number(lines),
        percentage: (Number(lines) / total) * 100
      }));
    }
    // Fall back to single language if only primary language exists (chart not useful) -> return empty to hide
    return [];
  };

  const getComplexityData = () => [
    { name: 'Cyclomatic', value: Number(analysisData.metrics?.complexity ?? analysisData.quality_metrics?.cyclomatic_complexity ?? 0) },
    { name: 'Maintainability', value: Number(maintainability) || 0 },
    { name: 'Architecture', value: Number(analysisData.quality?.architecture_score ?? 0) }
  ];

  // Technology roadmap nodes and edges
  const createRoadmapNodes = (): Node[] => {
    const technologies: string[] = [
      ...((analysisData.technology_stack?.frameworks as string[] | undefined) || []),
      ...((analysisData.technology_stack?.databases as string[] | undefined) || []),
      ...((analysisData.technology_stack?.tools as string[] | undefined) || []),
      ...((analysisData.technology_stack?.languages as string[] | undefined) || [])
    ];

    return technologies.map((tech, index) => ({
      id: `tech-${index}`,
      type: 'default',
      position: { 
        x: (index % 4) * 200, 
        y: Math.floor(index / 4) * 100 
      },
      data: { 
        label: tech 
      },
      style: {
        background: '#ffffff',
        border: '2px solid #000000',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '500'
      }
    }));
  };

  const createRoadmapEdges = (): Edge[] => {
    const nodes = createRoadmapNodes();
    const edges: Edge[] = [];
    
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({
        id: `edge-${i}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: 'smoothstep',
        style: { stroke: '#000000', strokeWidth: 2 }
      });
    }
    
    return edges;
  };

  const COLORS = ['#000000', '#404040', '#808080', '#a0a0a0', '#c0c0c0'];

  // Presence checks for charts/graphs
  const qualityData = getQualityData();
  const hasQualityData = qualityData.some((d) => Number(d.value) > 0);
  const languageData = getLanguageData();
  const hasLanguageData = languageData.length > 0;
  const complexityData = getComplexityData();
  const hasComplexityData = complexityData.some((d) => Number(d.value) > 0);
  const roadmapNodes = createRoadmapNodes();
  const hasRoadmap = roadmapNodes.length > 0;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-6">
          <h1 className="text-4xl font-bold text-black mb-2">
            Code Analysis Results
          </h1>
          <p className="text-xl text-gray-600">
            {repoFullName || `${analysisData.repository_info?.owner || 'Unknown'}/${analysisData.repository_info?.name || 'Repository'}`}
          </p>
          <div className="flex justify-center items-center mt-4 space-x-6">
            <Badge variant="outline" className="border-black text-black">
              {repoLanguage || 'Unknown'}
            </Badge>
            <span className="text-gray-600">★ {repoStars || 0}</span>
            <span className="text-gray-600">🍴 {repoForks || 0}</span>
            <span className="text-gray-600">Issues: {analysisData.repository_info?.open_issues || 0}</span>
          </div>
        </div>

        {/* Overall Score */}
        <Card className="border-2 border-black">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Overall Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-black mb-4">
                {analysisData.ai_insights?.overall_score || 0}
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-lg mb-4">
                <div 
                  className="h-full bg-black rounded-lg transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (analysisData.ai_insights?.overall_score || 0)))}%` }}
                />
              </div>
              <p className="mt-4 text-gray-600">
                Project Maturity: <span className="font-semibold text-black">
                  {analysisData.ai_insights?.project_maturity || 'Unknown'}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Metrics Pie Chart */}
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>Quality Metrics Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {hasQualityData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {qualityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">No quality data available</div>
              )}
            </CardContent>
          </Card>

          {/* Language Distribution */}
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>Language Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {hasLanguageData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={languageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="lines" fill="#000000" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">Language breakdown not available</div>
              )}
            </CardContent>
          </Card>

          {/* Complexity Analysis */}
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>Complexity Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {hasComplexityData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complexityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#000000" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">Complexity metrics not available</div>
              )}
            </CardContent>
          </Card>

          {/* Technology Roadmap */}
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>Technology Stack Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              {hasRoadmap ? (
                <div style={{ height: '300px', width: '100%' }}>
                  <ReactFlow
                    nodes={roadmapNodes}
                    edges={createRoadmapEdges()}
                    fitView
                    attributionPosition="bottom-left"
                  >
                    <Background color="#f0f0f0" gap={16} />
                    <Controls />
                  </ReactFlow>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">Technology stack data not available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>🤖 AI Code Assessment</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysisData.ai_insights?.code_assessment || 'No code assessment available'}
              </ReactMarkdown>
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>🏗️ Architecture Assessment</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {analysisData.ai_insights?.architecture_assessment || 'No architecture assessment available'}
              </ReactMarkdown>
            </CardContent>
          </Card>
        </div>

        {/* Maintainability and Improvements */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {analysisData.ai_insights?.maintainability_assessment && (
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle>🔧 Maintainability Assessment</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {analysisData.ai_insights?.maintainability_assessment}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}

    {analysisData.ai_insights?.improvement_areas && (
            <Card className="border-2 border-black">
              <CardHeader>
                <CardTitle>💡 Areas for Improvement</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {analysisData.ai_insights?.improvement_areas}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Strengths */}
        {analysisData.ai_insights?.strengths && analysisData.ai_insights.strengths.length > 0 && (
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>✨ Project Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisData.ai_insights.strengths.map((strength, index) => (
                  <div key={index} className="p-4 border border-gray-300 rounded-lg">
                    <div className="prose prose-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {strength}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>📊 Code Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Files:</span>
                <span className="font-bold">{analysisData.code_metrics?.total_files?.toLocaleString?.() ?? '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Lines:</span>
                <span className="font-bold">{analysisData.code_metrics?.total_lines?.toLocaleString?.() ?? '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Complexity Score:</span>
                <span className="font-bold">{analysisData.code_metrics?.complexity_score ?? 0}/10</span>
              </div>
              <div className="flex justify-between">
                <span>Test Coverage:</span>
                <span className="font-bold">{analysisData.code_metrics?.test_coverage ?? 0}%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>🔒 Security Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Security Score:</span>
                <span className="font-bold">{analysisData.security_analysis?.security_score ?? 0}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Vulnerabilities:</span>
                <span className="font-bold text-red-600">{analysisData.security_analysis?.vulnerability_count ?? 0}</span>
              </div>
              <Progress value={analysisData.security_analysis?.security_score ?? 0} className="w-full" />
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>📈 Repository Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Total Commits:</span>
                <span className="font-bold">{analysisData.commit_analysis?.total_commits?.toLocaleString?.() ?? '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Contributors:</span>
                <span className="font-bold">{analysisData.commit_analysis?.contributors ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Repository Size:</span>
                <span className="font-bold">{((repoSize ?? 0) / 1024).toFixed(1)} MB</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Recommendations */}
        {(() => {
          const securityFindings: string[] = (analysisData.security_analysis?.recommendations as string[] | undefined)
            ?? (analysisData.security?.security_hotspots as string[] | undefined)
            ?? (analysisData.security?.critical_issues as string[] | undefined)
            ?? [];
          return securityFindings.length > 0 ? (
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>🛡️ Security Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityFindings.map((rec: string, index: number) => (
                  <div key={index} className="p-3 border-l-4 border-black bg-gray-50">
                    <div className="prose prose-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{rec}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          ) : null;
        })()}

        {/* Technology Stack */}
        <Card className="border-2 border-black">
          <CardHeader>
            <CardTitle>🛠️ Technology Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-bold mb-3">Frameworks</h4>
                <div className="space-y-2">
                  {(analysisData.technology_stack?.frameworks ?? []).map((framework: string, index: number) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {framework}
                    </Badge>
                  ))}
                  {(!analysisData.technology_stack?.frameworks || analysisData.technology_stack.frameworks.length === 0) && (
                    <span className="text-gray-500">No frameworks detected</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3">Databases</h4>
                <div className="space-y-2">
                  {(analysisData.technology_stack?.databases ?? []).map((db: string, index: number) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {db}
                    </Badge>
                  ))}
                  {(!analysisData.technology_stack?.databases || analysisData.technology_stack.databases.length === 0) && (
                    <span className="text-gray-500">No databases detected</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3">Tools</h4>
                <div className="space-y-2">
                  {(analysisData.technology_stack?.tools ?? []).map((tool: string, index: number) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {tool}
                    </Badge>
                  ))}
                  {(!analysisData.technology_stack?.tools || analysisData.technology_stack.tools.length === 0) && (
                    <span className="text-gray-500">No tools detected</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-3">Languages</h4>
                <div className="space-y-2">
                  {(analysisData.technology_stack?.languages ?? []).map((lang: string, index: number) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {lang}
                    </Badge>
                  ))}
                  {(!analysisData.technology_stack?.languages || analysisData.technology_stack.languages.length === 0) && (
                    <span className="text-gray-500">No languages detected</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsPage;
