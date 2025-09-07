"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import ReactFlow, { Node, Edge, Background, Controls, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useParams } from 'next/navigation';
import { useAnalysisCacheOnly } from '@/react-query/analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalysisResult {
  // New backend shape
  repository?: {
    full_name?: string;
    description?: string;
    stars?: number;
    forks?: number;
    language?: string;
    size?: number;
    open_issues_count?: number;
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
  security_metrics?: {
    security_score?: number;
    critical_issues?: number;
    security_hotspots?: number;
    potential_vulnerabilities?: number;
    high_issues?: number;
    medium_issues?: number;
    low_issues?: number;
    has_security_policy?: boolean;
    uses_secrets_scanning?: boolean;
    has_dependency_updates?: boolean;
    hardcoded_secrets?: number;
    sql_injection_risks?: number;
    xss_risks?: number;
    unsafe_operations?: number;
    insecure_deserialization?: number;
    insecure_file_operations?: number;
    command_injection?: number;
    sensitive_files?: number;
    issue_locations?: Record<string, string[]>;
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
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground text-lg">No analysis data found.</p>
          <p className="text-muted-foreground text-sm mt-2">Please run an analysis first.</p>
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
  const initialRepoSize = analysisData.repository?.size ?? analysisData.repository_info?.size;

  // Quality metrics mapping - with better fallbacks and debugging
  const maintainability = analysisData.metrics?.maintainability
    ?? analysisData.quality_metrics?.maintainability_index
    ?? analysisData.code_metrics?.maintainability_index
    ?? 0;

  const documentation = analysisData.quality?.documentation_coverage
    ?? analysisData.code_metrics?.documentation_coverage
    ?? analysisData.quality_metrics?.docstring_coverage
    ?? 0;

  // Function to safely extract the security score
  const getSecurityScore = () => {
    // Try to access the security score from various possible locations
    const directScore = 
      analysisData.security_metrics?.security_score ?? 
      analysisData.security?.security_score ??
      analysisData.security_analysis?.security_score;
    
    // Check if we have a direct numeric score
    if (typeof directScore === 'number' && !isNaN(directScore)) {
      return directScore;
    }
    
    // If we get here, try to calculate a score based on available metrics
    try {
      const metrics = analysisData.security_metrics;
      if (metrics) {
        // Get critical issues count safely
        let criticalIssues = 0;
        if (typeof metrics.critical_issues === 'number') {
          criticalIssues = metrics.critical_issues;
        } else if (Array.isArray(metrics.critical_issues)) {
          criticalIssues = (metrics.critical_issues as string[]).length;
        }
        
        // Get other issue counts safely
        let highIssues = typeof metrics.high_issues === 'number' ? metrics.high_issues : 0;
        let mediumIssues = typeof metrics.medium_issues === 'number' ? metrics.medium_issues : 0;
        let lowIssues = typeof metrics.low_issues === 'number' ? metrics.low_issues : 0;
        
        // If we have any issues, calculate a score
        const total = criticalIssues + highIssues + mediumIssues + lowIssues;
        
        if (total > 0) {
          // Simple algorithm: start with 100 and subtract based on issues
          const calculatedScore = Math.max(0, 100 - 
            criticalIssues * 10 - 
            highIssues * 5 - 
            mediumIssues * 2 - 
            lowIssues * 0.5
          );
          
          return Math.round(calculatedScore);
        }
        
        // If we have security hotspots but no issues, use that for a score
        let securityHotspots = 0;
        if (typeof metrics.security_hotspots === 'number') {
          securityHotspots = metrics.security_hotspots;
        } else if (Array.isArray(metrics.security_hotspots)) {
          securityHotspots = (metrics.security_hotspots as string[]).length;
        }
        
        if (securityHotspots > 0) {
          // Score based on hotspots - less severe than issues
          return Math.max(50, 100 - securityHotspots * 2);
        }
      }
      
      // Try to calculate from security object
      if (analysisData.security) {
        let criticalIssues = 0;
        let securityHotspots = 0;
        
        // Get counts safely
        if (typeof analysisData.security.critical_issues === 'number') {
          criticalIssues = analysisData.security.critical_issues;
        } else if (Array.isArray(analysisData.security.critical_issues)) {
          criticalIssues = analysisData.security.critical_issues.length;
        }
        
        if (typeof analysisData.security.security_hotspots === 'number') {
          securityHotspots = analysisData.security.security_hotspots;
        } else if (Array.isArray(analysisData.security.security_hotspots)) {
          securityHotspots = analysisData.security.security_hotspots.length;
        }
        
        if (criticalIssues > 0 || securityHotspots > 0) {
          // Simple algorithm based on available data
          return Math.max(0, 100 - criticalIssues * 10 - securityHotspots * 1);
        }
      }
    } catch (e) {
      console.error("Error calculating security score:", e);
    }
    
    // If security data exists but no score could be calculated, default to 50
    if (analysisData.security_metrics || analysisData.security) {
      return 50;
    }
    
    // Default score if no security data exists
    return 0;
  };
  
  const securityScore = getSecurityScore();

  // Files analyzed - try multiple sources
  const filesAnalyzed = analysisData.metrics?.files_analyzed
    ?? analysisData.code_metrics?.total_files
    ?? analysisData.code_metrics?.files_analyzed
    ?? analysisData.quality_metrics?.files_analyzed
    ?? 0;

  // Total lines - try multiple sources
  const totalLines = analysisData.metrics?.total_lines
    ?? analysisData.code_metrics?.total_lines
    ?? analysisData.metrics?.lines_of_code
    ?? analysisData.code_metrics?.lines_of_code
    ?? 0;

  // Repository size - try multiple sources
  const repoSize = analysisData.repository?.size
    ?? analysisData.repository_info?.size
    ?? analysisData.code_metrics?.repository_size
    ?? 0;

  // Complexity score - try multiple sources
  const complexityScore = analysisData.metrics?.complexity
    ?? analysisData.code_metrics?.complexity_score
    ?? analysisData.quality_metrics?.cyclomatic_complexity
    ?? 0;

  // Test coverage - try multiple sources
  const testCoverage = analysisData.quality?.test_files
    ? Math.min(100, Math.round((analysisData.quality.test_files / Math.max(filesAnalyzed, 1)) * 100))
    : analysisData.code_metrics?.test_coverage
    ?? analysisData.quality_metrics?.test_coverage
    ?? 0;

  // Open issues - try multiple sources
  const openIssues = analysisData.repository_info?.open_issues
    ?? analysisData.repository?.open_issues_count
    ?? 0;

  // Deep debug of security metrics
  React.useEffect(() => {
    if (analysisData) {
      console.log('Security Data Deep Debug:', {
        security: analysisData.security,
        security_metrics: analysisData.security_metrics,
        security_analysis: analysisData.security_analysis,
        // Log more detailed type information
        securityMetricsType: analysisData.security_metrics ? typeof analysisData.security_metrics : 'undefined',
        criticalIssuesType: analysisData.security_metrics?.critical_issues 
          ? typeof analysisData.security_metrics.critical_issues + (Array.isArray(analysisData.security_metrics.critical_issues) ? ' (array)' : '')
          : 'undefined',
        securityHotspotsType: analysisData.security_metrics?.security_hotspots
          ? typeof analysisData.security_metrics.security_hotspots + (Array.isArray(analysisData.security_metrics.security_hotspots) ? ' (array)' : '')
          : 'undefined',
        // If it's a number that looks suspiciously like a memory address, note it
        criticalIssuesValue: analysisData.security_metrics?.critical_issues,
        securityHotspotsValue: analysisData.security_metrics?.security_hotspots,
        securityScore: getSecurityScore(),
        // Check if calculated value is a valid number
        calculatedSecurityScore: getSecurityScore(),
        isScoreValidNumber: !isNaN(getSecurityScore()),
        // Check if direct security score exists and is valid
        directSecurityScore: analysisData.security_metrics?.security_score,
        isDirectScoreValidNumber: !isNaN(analysisData.security_metrics?.security_score || 0),
        // Log a sample of the raw structure for reference
        rawSample: JSON.stringify(analysisData).slice(0, 500) + '...'
      });
    }
  }, [analysisData]);

  // Original debug logging
  console.log('Analysis Data Debug:', {
    hasMetrics: !!analysisData.metrics,
    hasCodeMetrics: !!analysisData.code_metrics,
    hasQualityMetrics: !!analysisData.quality_metrics,
    hasRepository: !!analysisData.repository,
    hasRepositoryInfo: !!analysisData.repository_info,
    hasSecurityMetrics: !!analysisData.security_metrics,
    hasSecurity: !!analysisData.security,
    hasSecurityAnalysis: !!analysisData.security_analysis,
    securityScore,
    filesAnalyzed,
    totalLines,
    repoSize,
    complexityScore,
    testCoverage,
    openIssues
  });

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

  // Theme-driven chart palette (aligns with homepage variables)
  const THEME_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--primary))',
  ];

  // Technology roadmap nodes and edges
  type TechItem = { name: string; version?: string | number | null };

  const asTechItems = (arr: any): TechItem[] => {
    if (!arr) return [];
    try {
      return (arr as any[]).map((v) => {
        if (typeof v === 'string') return { name: v };
        if (v && typeof v === 'object') {
          const name = String((v as any).name ?? (v as any).label ?? (v as any).id ?? '').trim();
          const version = (v as any).version ?? (v as any).ver ?? (v as any).v ?? undefined;
          return name ? { name, version } : null;
        }
        return null;
      }).filter(Boolean) as TechItem[];
    } catch {
      return [];
    }
  };

  const tech = {
    languages: asTechItems(analysisData.technology_stack?.languages),
    frameworks: asTechItems(analysisData.technology_stack?.frameworks),
    libraries: asTechItems(analysisData.technology_stack?.libraries),
    databases: asTechItems(analysisData.technology_stack?.databases),
    tools: asTechItems(analysisData.technology_stack?.tools),
    testing: asTechItems((analysisData.technology_stack as any)?.testing_frameworks),
    build: asTechItems((analysisData.technology_stack as any)?.build_tools),
    deployment: asTechItems((analysisData.technology_stack as any)?.deployment_tools),
    platforms: asTechItems((analysisData.technology_stack as any)?.platforms),
  };

  const primaryLanguage = (analysisData.technology_stack as any)?.primary_language || tech.languages[0]?.name;

  const linkToLanguage = (item: string): string | undefined => {
    const s = item.toLowerCase();
    const findLang = (names: string[]) => tech.languages.find((l) => names.includes(l.name.toLowerCase()))?.name;
    if (/react|next|vite|webpack|redux|tanstack|prisma|drizzle|express|nest|node|typescript|javascript|pnpm|bun|vitest|jest|playwright|cypress/.test(s)) {
      return findLang(['typescript', 'javascript']) || primaryLanguage;
    }
    if (/django|fastapi|flask|pytorch|tensorflow|numpy|pandas|pytest|poetry/.test(s)) return findLang(['python']);
    if (/spring|maven|gradle|junit/.test(s)) return findLang(['java']);
    if (/go|gin/.test(s)) return findLang(['go']);
    if (/rust|cargo/.test(s)) return findLang(['rust']);
    if (/c#|dotnet|asp\.net/.test(s)) return findLang(['c#', 'csharp', '.net', 'dotnet']);
    return primaryLanguage;
  };

  const createRoadmapNodes = (): Node[] => {
    // Build hierarchical layers for a tree
    const layers: { key: string; label: string }[][] = [];
    const root: { key: string; label: string } = { key: 'root', label: 'Tech Stack' };
    layers.push([root]);

    const langLayer = tech.languages.map((l, i) => ({ key: `lang-${i}-${l.name}`, label: l.name }));
    if (langLayer.length) layers.push(langLayer);

    const fwLayer = tech.frameworks.map((f, i) => ({ key: `fw-${i}-${f.name}`, label: f.version ? `${f.name} v${f.version}` : f.name }));
    if (fwLayer.length) layers.push(fwLayer);

    const libToolsLayer = [
      ...tech.libraries.map((l, i) => ({ key: `lib-${i}-${l.name}`, label: l.version ? `${l.name} v${l.version}` : l.name })),
      ...tech.tools.map((t, i) => ({ key: `tool-${i}-${t.name}`, label: t.version ? `${t.name} v${t.version}` : t.name })),
      ...tech.testing.map((t, i) => ({ key: `test-${i}-${t.name}`, label: t.version ? `${t.name} v${t.version}` : t.name })),
      ...tech.build.map((b, i) => ({ key: `build-${i}-${b.name}`, label: b.version ? `${b.name} v${b.version}` : b.name })),
    ];
    if (libToolsLayer.length) layers.push(libToolsLayer);

    const dbLayer = tech.databases.map((d, i) => ({ key: `db-${i}-${d.name}`, label: d.version ? `${d.name} v${d.version}` : d.name }));
    if (dbLayer.length) layers.push(dbLayer);

    const deployLayer = [
      ...tech.deployment.map((d, i) => ({ key: `deploy-${i}-${d.name}`, label: d.name })),
      ...tech.platforms.map((p, i) => ({ key: `plat-${i}-${p.name}`, label: p.name })),
    ];
    if (deployLayer.length) layers.push(deployLayer);

    // Compute positions per layer
    const layerY = (idx: number) => 60 + idx * 90; // vertical spacing
    const computeX = (count: number, i: number) => {
      const width = 800; // virtual width
      const gap = count > 1 ? width / (count - 1) : 0;
      return (count > 1 ? i * gap : width / 2) - width / 2;
    };

    const nodes: Node[] = [];
    layers.forEach((items, li) => {
      items.forEach((it, i) => {
        const isRoot = it.key === 'root';
        nodes.push({
          id: it.key,
          type: 'default',
          position: { x: computeX(items.length, i), y: layerY(li) },
          data: { label: it.label },
          style: {
            background: isRoot ? '#4f46e5' : 'white',
            border: `2px solid ${isRoot ? '#4f46e5' : '#3b82f6'}`,
            borderRadius: '8px',
            color: isRoot ? 'white' : '#1f2937',
            fontSize: isRoot ? '14px' : '12px',
            fontWeight: 600,
            padding: 8,
            width: isRoot ? 180 : 160,
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
        });
      });
    });

    return nodes;
  };

  const createRoadmapEdges = (): Edge[] => {
    const edges: Edge[] = [];
    // Direct RGB colors that are clearly visible across all themes
    const primaryEdgeStyle = { stroke: '#3b82f6', strokeWidth: 2.5 } as const; // Bright blue
    const secondaryEdgeStyle = { stroke: '#8b5cf6', strokeWidth: 2.5 } as const; // Purple
    const dashedEdgeStyle = { stroke: '#10b981', strokeWidth: 2.5, strokeDasharray: '5 5' } as const; // Green
    // Root -> Languages
    tech.languages.forEach((l, i) => {
  edges.push({ id: `e-root-lang-${i}`, source: 'root', target: `lang-${i}-${l.name}`, type: 'smoothstep', animated: true, style: primaryEdgeStyle });
    });

    // Languages -> Frameworks
    tech.frameworks.forEach((f, i) => {
      const lang = linkToLanguage(f.name) || primaryLanguage || 'lang-0';
      const langIdx = tech.languages.findIndex((l) => l.name === lang);
      const langId = langIdx >= 0 ? `lang-${langIdx}-${lang}` : 'root';
  edges.push({ id: `e-lang-fw-${i}`, source: langId, target: `fw-${i}-${f.name}`, type: 'smoothstep', animated: true, style: primaryEdgeStyle });
    });

    // Frameworks -> Libraries/Tools/Testing/Build (associate to nearest language/framework)
    const connectToFrameworkOrLang = (name: string) => {
      const s = name.toLowerCase();
      // Prefer specific framework anchors
      const fwIndex = tech.frameworks.findIndex((f) => s.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(name.toLowerCase()));
      if (fwIndex >= 0) return `fw-${fwIndex}-${tech.frameworks[fwIndex].name}`;
      // Heuristic: map to language
      const lang = linkToLanguage(name) || primaryLanguage || tech.languages[0]?.name;
      const li = tech.languages.findIndex((l) => l.name === lang);
      return li >= 0 ? `lang-${li}-${lang}` : 'root';
    };

    const attach = (prefix: string, arr: TechItem[]) => {
      arr.forEach((it, i) => {
        const from = connectToFrameworkOrLang(it.name);
        const to = `${prefix}-${i}-${it.name}`;
  // For secondary layers, use dashed lines for clearer separation
  const style = ['lib', 'tool', 'test', 'build'].includes(prefix) ? dashedEdgeStyle : secondaryEdgeStyle;
  edges.push({ id: `e-${prefix}-${i}`, source: from, target: to, type: 'smoothstep', style });
      });
    };

    attach('lib', tech.libraries);
    attach('tool', tech.tools);
    attach('test', tech.testing);
    attach('build', tech.build);

    // Root/Backends -> Databases
    tech.databases.forEach((d, i) => {
      // Try to connect from server-side frameworks if present
      const serverFwIdx = tech.frameworks.findIndex((f) => /express|nest|fastapi|django|spring|rails|laravel|gin/.test(f.name.toLowerCase()));
      const source = serverFwIdx >= 0 ? `fw-${serverFwIdx}-${tech.frameworks[serverFwIdx].name}` : 'root';
  edges.push({ id: `e-db-${i}`, source, target: `db-${i}-${d.name}`, type: 'smoothstep', style: secondaryEdgeStyle });
    });

    // Deployment/Platforms from Root
    tech.deployment.forEach((d, i) => {
  edges.push({ id: `e-deploy-${i}`, source: 'root', target: `deploy-${i}-${d.name}`, type: 'smoothstep', style: secondaryEdgeStyle });
    });
    tech.platforms.forEach((p, i) => {
  const source = tech.deployment.length ? `deploy-0-${tech.deployment[0].name}` : 'root';
  edges.push({ id: `e-plat-${i}`, source, target: `plat-${i}-${p.name}`, type: 'smoothstep', style: dashedEdgeStyle });
    });

    return edges;
  };

  const COLORS = THEME_COLORS;

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
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center border-b border-border pb-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Code Analysis Results</h1>
          <p className="text-base md:text-lg text-muted-foreground">
            {repoFullName || `${analysisData.repository_info?.owner || 'Unknown'}/${analysisData.repository_info?.name || 'Repository'}`}
          </p>
          <div className="flex flex-wrap justify-center items-center mt-4 gap-3 text-sm">
            <Badge variant="outline">{repoLanguage || 'Unknown'}</Badge>
            <span className="text-muted-foreground">★ {repoStars || 0}</span>
            <span className="text-muted-foreground">🍴 {repoForks || 0}</span>
            <span className="text-muted-foreground">📁 {filesAnalyzed || 0} files</span>
            <span className="text-muted-foreground">📝 {totalLines?.toLocaleString?.() || '0'} lines</span>
            <span className="text-muted-foreground">💾 {initialRepoSize ? `${(initialRepoSize / 1024).toFixed(1)} MB` : 'Unknown'}</span>
            <span className="text-muted-foreground">⚠️ {openIssues || 0} issues</span>
          </div>
        </div>

        {/* Tabs to reduce scrolling */}
        <Tabs defaultValue="overview" className="w-full">
          <div className="sticky top-0 z-10 -mx-4 sm:mx-0 mb-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="overflow-x-auto">
              <div className="px-4 sm:px-0">
                <TabsList aria-label="Results sections" className="min-w-max">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="tech">Tech</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Data Availability Indicator */}
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-sm">Data Sources</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className={`p-2 rounded ${analysisData.metrics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Metrics: {analysisData.metrics ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.code_metrics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Code Metrics: {analysisData.code_metrics ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.quality_metrics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Quality Metrics: {analysisData.quality_metrics ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.repository ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Repository: {analysisData.repository ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.repository_info ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Repository Info: {analysisData.repository_info ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.security_metrics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Security Metrics: {analysisData.security_metrics ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.security ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Security: {analysisData.security ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.security_analysis ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Security Analysis: {analysisData.security_analysis ? '✓' : '✗'}
                  </div>
                  <div className={`p-2 rounded ${analysisData.technology_stack ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    Tech Stack: {analysisData.technology_stack ? '✓' : '✗'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Maintainability</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{Math.round(Number(maintainability) || 0)}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Index Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Test Coverage</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{testCoverage}%</div>
                  <div className="text-xs text-muted-foreground mt-1">Code Coverage</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Files Analyzed</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{filesAnalyzed?.toLocaleString?.() || '0'}</div>
                  <div className="text-xs text-muted-foreground mt-1">Total Files</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Code Size</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">{totalLines?.toLocaleString?.() || '0'}</div>
                  <div className="text-xs text-muted-foreground mt-1">Lines of Code</div>
                </CardContent>
              </Card>
            </div>

            {/* Primary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Quality Metrics Distribution</CardTitle></CardHeader>
                <CardContent>
                  {hasQualityData ? (
                    <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={qualityData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {qualityData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">No quality data available</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Language Distribution</CardTitle></CardHeader>
                <CardContent>
                  {hasLanguageData ? (
                    <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={languageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Bar dataKey="lines" fill="hsl(var(--primary))" />
                      </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">Language breakdown not available</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>🤖 AI Code Assessment</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisData.ai_insights?.code_assessment || 'No code assessment available'}
                  </ReactMarkdown>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>🏗️ Architecture Assessment</CardTitle></CardHeader>
                <CardContent className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisData.ai_insights?.architecture_assessment || 'No architecture assessment available'}
                  </ReactMarkdown>
                </CardContent>
              </Card>
              {analysisData.ai_insights?.maintainability_assessment && (
                <Card>
                  <CardHeader><CardTitle>🔧 Maintainability Assessment</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysisData.ai_insights?.maintainability_assessment}
                    </ReactMarkdown>
                  </CardContent>
                </Card>
              )}
              {analysisData.ai_insights?.improvement_areas && (
                <Card>
                  <CardHeader><CardTitle>💡 Areas for Improvement</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {analysisData.ai_insights?.improvement_areas}
                    </ReactMarkdown>
                  </CardContent>
                </Card>
              )}
              {analysisData.ai_insights?.strengths && analysisData.ai_insights.strengths.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle>✨ Project Strengths</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {analysisData.ai_insights.strengths.map((strength, index) => (
                        <div key={index} className="p-3 rounded-lg border border-border">
                          <div className="prose prose-sm text-foreground">
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
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Complexity Analysis</CardTitle></CardHeader>
                <CardContent>
                  {hasComplexityData ? (
                    <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={complexityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#71717a" />
                        <YAxis stroke="#71717a" />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#3b82f6" 
                          strokeWidth={3} 
                          dot={{ r: 6, strokeWidth: 2, fill: 'white' }}
                          activeDot={{ r: 8, strokeWidth: 0, fill: '#3b82f6' }}
                          isAnimationActive={true}
                        />
                      </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">Complexity metrics not available</div>
                  )}
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader><CardTitle>📊 Code Metrics</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Files</span><span className="font-medium">{filesAnalyzed?.toLocaleString?.() || '0'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Lines</span><span className="font-medium">{totalLines?.toLocaleString?.() || '0'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Lines of Code</span><span className="font-medium">{(analysisData.metrics?.lines_of_code ?? analysisData.code_metrics?.lines_of_code ?? 0)?.toLocaleString?.() || '0'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Complexity Score</span><span className="font-medium">{complexityScore?.toFixed?.(2) || '0'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Test Coverage</span><span className="font-medium">{testCoverage}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Documentation</span><span className="font-medium">{Math.round(Number(documentation) || 0)}%</span></div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>📈 Repository Stats</CardTitle></CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Commits</span><span className="font-medium">{analysisData.commit_analysis?.total_commits?.toLocaleString?.() ?? '0'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Contributors</span><span className="font-medium">{analysisData.commit_analysis?.contributors ?? 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Repository Size</span><span className="font-medium">{repoSize ? `${(repoSize / 1024).toFixed(1)} MB` : 'Unknown'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Open Issues</span><span className="font-medium">{openIssues || 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Stars</span><span className="font-medium">{repoStars?.toLocaleString?.() || '0'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Forks</span><span className="font-medium">{repoForks?.toLocaleString?.() || '0'}</span></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tech Tab */}
          <TabsContent value="tech">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Technology Stack Roadmap</CardTitle></CardHeader>
                <CardContent>
                  {hasRoadmap ? (
                    <div className="h-[240px] sm:h-[280px] lg:h-[320px] w-full bg-white rounded-md border-2 border-gray-200 overflow-hidden">
                      <ReactFlow
                        nodes={roadmapNodes}
                        edges={createRoadmapEdges()}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        defaultEdgeOptions={{ style: { stroke: '#3b82f6', strokeWidth: 2.5 } }}
                        attributionPosition="bottom-left"
                        style={{ backgroundColor: 'white' }}
                      >
                        <Background variant={BackgroundVariant.Dots} color="rgba(0, 0, 0, 0.2)" gap={18} size={1.5} />
                        <Controls />
                      </ReactFlow>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-12">Technology stack data not available</div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>🛠️ Technology Stack</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Frameworks</h4>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.technology_stack?.frameworks ?? []).map((framework: string, index: number) => (
                          <Badge key={index} variant="outline">{framework}</Badge>
                        ))}
                        {(!analysisData.technology_stack?.frameworks || analysisData.technology_stack.frameworks.length === 0) && (
                          <span className="text-muted-foreground text-sm">No frameworks detected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Databases</h4>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.technology_stack?.databases ?? []).map((db: string, index: number) => (
                          <Badge key={index} variant="outline">{db}</Badge>
                        ))}
                        {(!analysisData.technology_stack?.databases || analysisData.technology_stack.databases.length === 0) && (
                          <span className="text-muted-foreground text-sm">No databases detected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tools</h4>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.technology_stack?.tools ?? []).map((tool: string, index: number) => (
                          <Badge key={index} variant="outline">{tool}</Badge>
                        ))}
                        {(!analysisData.technology_stack?.tools || analysisData.technology_stack.tools.length === 0) && (
                          <span className="text-muted-foreground text-sm">No tools detected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.technology_stack?.languages ?? []).map((lang: string, index: number) => (
                          <Badge key={index} variant="outline">{lang}</Badge>
                        ))}
                        {(!analysisData.technology_stack?.languages || analysisData.technology_stack.languages.length === 0) && (
                          <span className="text-muted-foreground text-sm">No languages detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>🔒 Security Analysis</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Security Score</span><span className="font-medium">{Math.round(Number(securityScore) || 0)}/100</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Critical Issues</span>
                    <span className="font-medium text-destructive">
                      {(() => {
                        // Try to access security metrics critical issues
                        const criticalIssues = analysisData.security_metrics?.critical_issues as number | string[] | undefined;
                        
                        // If it's a direct number, use it
                        if (typeof criticalIssues === 'number') {
                          return criticalIssues;
                        }
                        
                        // If it's an array, use the length
                        if (Array.isArray(criticalIssues)) {
                          return criticalIssues.length;
                        }
                        
                        // Try security.critical_issues if it exists
                        if (analysisData.security?.critical_issues) {
                          // Handle both number and array cases
                          if (typeof analysisData.security.critical_issues === 'number') {
                            return analysisData.security.critical_issues;
                          }
                          if (Array.isArray(analysisData.security.critical_issues)) {
                            return (analysisData.security.critical_issues as string[]).length;
                          }
                        }
                        
                        // Final fallback
                        return 0;
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Security Hotspots</span>
                    <span className="font-medium text-orange-600">
                      {(() => {
                        // Try to access security metrics security hotspots
                        const securityHotspots = analysisData.security_metrics?.security_hotspots;

                        // If it's a direct number, use it
                        if (typeof securityHotspots === 'number') {
                          return securityHotspots;
                        }

                        // If it's an array, use the length (with type assertion for compatibility)
                        if (Array.isArray(securityHotspots)) {
                          return (securityHotspots as string[]).length;
                        }

                        // Try security.security_hotspots if it exists
                        if (analysisData.security?.security_hotspots) {
                          // Handle both number and array cases
                          if (typeof analysisData.security.security_hotspots === 'number') {
                            return analysisData.security.security_hotspots;
                          }
                          if (Array.isArray(analysisData.security.security_hotspots)) {
                            return (analysisData.security.security_hotspots as string[]).length;
                          }
                        }

                        // Final fallback
                        return 0;
                      })()}
                    </span>
                  </div>
                  <Progress value={Math.round(Number(securityScore) || 0)} className="w-full" />
                </CardContent>
              </Card>
              {(() => {
                const securityFindings: string[] = (analysisData.security_analysis?.recommendations as string[] | undefined)
                  ?? (analysisData.security_metrics?.security_hotspots as string[] | undefined)
                  ?? (analysisData.security?.security_hotspots as string[] | undefined)
                  ?? (analysisData.security_metrics?.critical_issues as string[] | undefined)
                  ?? (analysisData.security?.critical_issues as string[] | undefined)
                  ?? [];
                return securityFindings.length > 0 ? (
                  <Card>
                    <CardHeader><CardTitle>🛡️ Security Recommendations</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {securityFindings.map((rec: string, index: number) => (
                          <div key={index} className="p-3 border-l-4 border-border bg-muted/30 rounded-r">
                            <div className="prose prose-sm text-foreground">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{rec}</ReactMarkdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card><CardContent className="text-muted-foreground py-8">No security recommendations available</CardContent></Card>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ResultsPage;
