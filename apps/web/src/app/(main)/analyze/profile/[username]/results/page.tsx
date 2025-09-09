"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { saveProfileAnalysisAsProject } from "@/actions/profileAnalysisResult";
import { saveMultipleGitHubAnalysesAsProjects } from "@/actions/analysisResult";
import { extractTechStack, extractAISummary } from "@/lib/analysisHelpers";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  User,
  Github,
  Code2,
  Briefcase,
  GraduationCap,
  Star,
  GitFork,
  FileText,
  ArrowLeft,
  TrendingUp,
  Award,
  Target,
  Lightbulb,
  Calendar,
  MapPin,
  Building,
  BookOpen,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Cpu,
  Database,
  Hammer,
  ExternalLink,
  Layers,
  GanttChart,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from "recharts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";
import dynamic from "next/dynamic";
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  Controls,
} from "reactflow";
import "reactflow/dist/style.css";

const ReactFlowClient: any = dynamic(async () => {
  const mod = await import("reactflow");
  const RF = (props: any) => (
    <mod.default {...props}>
      <mod.Background variant={mod.BackgroundVariant.Dots} color="rgba(0, 0, 0, 0.15)" gap={16} size={1} />
      <mod.Controls showInteractive={false} />
    </mod.default>
  );
  return RF as any;
}, {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-md border border-gray-200 bg-white">
      <div className="h-full w-full animate-pulse bg-[linear-gradient(110deg,rgba(0,0,0,0.03),45%,rgba(0,0,0,0.06),55%,rgba(0,0,0,0.03))] bg-[length:200%_100%]" />
    </div>
  )
});

// Add a minimal type for leaderboard response
type LeaderboardGeneral = {
  success: true;
  rank: number;
  score: number;
  leaderboardScore: { rank: number; score: number };
} | { success?: false; error: string };

interface ProfileAnalysisResult {
  profileSummary: {
    name: string;
    username: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    college: string | null;
  };
  repositoryAnalysis: {
    stats: {
      totalRepos: number;
      totalStars: number;
      totalForks: number;
      averageRepoSize: number;
      totalLinesOfCode?: number;
      averageComplexity?: number;
      averageQuality?: number;
      languages: Array<{
        language: string;
        repositoryCount: number;
        totalStars: number;
        totalLines?: number;
        percentage: number;
      }>;
    };
    topRepositories: Array<{
      name: string;
      description: string | null;
      language: string | null;
      stars: number;
      forks: number;
      url: string;
    }>;
    languageExpertise: Array<{
      language: string;
      repositoryCount: number;
      totalStars: number;
      totalLines?: number;
      percentage: number;
    }>;
    detailedAnalyses?: Array<{
      repository: {
        name: string;
        full_name: string;
        description: string | null;
        language: string | null;
        stars: number;
        forks: number;
        url: string;
      };
      analysis: any;
    }>;
  };
  careerAnalysis: {
    stats: {
      totalYearsExperience: number;
      totalEducationYears: number;
      skillsCount: number;
      currentRole: any;
      currentEducation: any;
    };
    experience: Array<{
      companyName: string;
      jobTitle: string;
      location: string | null;
      startDate: string;
      endDate: string | null;
      current: boolean;
      description: string | null;
    }>;
    education: Array<{
      institution: string;
      degree: string | null;
      fieldOfStudy: string | null;
      startDate: string;
      endDate: string | null;
      current: boolean;
      description: string | null;
    }>;
    skills: Array<{
      id: string;
      name: string;
    }>;
  };
  aiInsights: {
    strengths: string[];
    careerProgression: string;
    skillGaps: string[];
    recommendations: string[];
  };
  overallScore: number;
  generatedAt: string;
}

const ProfileAnalysisResults = () => {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<ProfileAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [batchSaveCount, setBatchSaveCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({});
  const [leaderboard, setLeaderboard] = useState<{ rank: number | null; score: number | null }>({ rank: null, score: null });
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);
  
  const toggleDescription = (id: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Function to process and save all projects from the analysis
  const processAndSaveAllProjects = async (analysisResults: ProfileAnalysisResult) => {
    if (!analysisResults.repositoryAnalysis.detailedAnalyses ||
        analysisResults.repositoryAnalysis.detailedAnalyses.length === 0) {
      return;
    }

    setIsBatchSaving(true);
    setBatchSaveCount(0);

    try {
      const projectsToSave = analysisResults.repositoryAnalysis.detailedAnalyses.map((repoAnalysis) => {
        // Extract owner and repo from the repository info
        const owner = repoAnalysis.repository.full_name?.split('/')[0] ||
                     repoAnalysis.analysis?.repository?.owner ||
                     repoAnalysis.analysis?.repository_info?.owner;

        const repo = repoAnalysis.repository.name ||
                    repoAnalysis.repository.full_name?.split('/')[1] ||
                    repoAnalysis.analysis?.repository?.name ||
                    repoAnalysis.analysis?.repository_info?.name;

        if (!owner || !repo) return null;

        // Extract tech stack and AI summary
        const techStack = extractTechStack(repoAnalysis.analysis);
        const aiSummary = extractAISummary(repoAnalysis.analysis);

        return {
          owner,
          repo,
          aiSummary,
          techStack,
          analysisData: repoAnalysis.analysis
        };
      }).filter((project): project is NonNullable<typeof project> => project !== null); // Filter out null values and assert type

      if (projectsToSave.length > 0) {
        console.log(`Saving ${projectsToSave.length} projects to database...`);
        const saveResult = await saveMultipleGitHubAnalysesAsProjects(projectsToSave);

        if (saveResult.success) {
          setBatchSaveCount(saveResult.projects?.length || 0);
          console.log(`Successfully saved ${saveResult.projects?.length || 0} projects`);
          toast({
            title: "Projects Saved Successfully",
            description: `Saved ${saveResult.projects?.length || 0} projects with their tech stacks and AI descriptions.`,
          });
        } else {
          console.error("Failed to save projects:", saveResult.error);
          toast({
            title: "Failed to Save Projects",
            description: saveResult.error || "An error occurred while saving projects.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error in batch saving projects:", error);
    } finally {
      setIsBatchSaving(false);
    }
  };

  useEffect(() => {
    // Load analysis result from sessionStorage
    try {
      const cached = sessionStorage.getItem("profileAnalysisResult");
      if (!cached) {
        router.push(`/${params.username}`);
        return;
      }

      const parsed = JSON.parse(cached);
      if (parsed?.success && parsed?.data) {
        setAnalysisData(parsed.data);
      } else {
        router.push(`/${params.username}`);
        return;
      }
    } catch (error) {
      console.error("Failed to load analysis result:", error);
      router.push(`/${params.username}`);
      return;
    }

    setLoading(false);
  }, [params.username, router]);

  // Effect to save the analysis data to the database when it's available
  useEffect(() => {
    const saveAnalysisToDb = async () => {
      if (analysisData && !isSaved) {
        // Save profile analysis first
        const result = await saveProfileAnalysisAsProject(
          params.username,
          analysisData
        );

        if (result.success) {
          console.log("Profile analysis saved to database", result);
          setIsSaved(true);

          // Now save all individual projects
          await processAndSaveAllProjects(analysisData);
        } else {
          console.error(
            "Failed to save profile analysis to database:",
            result.error
          );
        }
      }
    };

    saveAnalysisToDb();
  }, [analysisData, isSaved, params.username]);
  
  // Fetch leaderboard GENERAL score/rank for this username.
  // Important: place this before any early return to keep hook order stable across renders.
  useEffect(() => {
    const controller = new AbortController();
    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const res = await fetch(
          `/api/leaderboard/by-username?username=${encodeURIComponent(params.username)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: any = await res.json();
        if (json?.success && json?.data?.success) {
          const d = json.data;
          setLeaderboard({ rank: d.rank ?? null, score: d.score ?? null });
        } else if (json?.success && json?.data && !json.data.error) {
          // handle shape where data is already flattened
          setLeaderboard({ rank: json.data.rank ?? null, score: json.data.score ?? null });
        } else {
          setLeaderboard({ rank: null, score: null });
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('Failed to load leaderboard data', e);
        }
      } finally {
        setLeaderboardLoading(false);
      }
    };
    if (params?.username) fetchLeaderboard();
    return () => controller.abort();
  }, [params.username]);
  // ---------- Aggregations and memos must be declared before any early returns to keep hook order stable ----------
  const COLORS = ["#000000", "#404040", "#808080", "#a0a0a0", "#c0c0c0"];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  // ---------- Aggregations across all projects (repos) ----------
  type TechItem = { name: string; version?: string | number | null };

  const toTechItems = (arr: any): TechItem[] => {
    if (!arr) return [];
    try {
      return (arr as any[])
        .map((v) => {
          if (typeof v === "string") return { name: v };
          if (v && typeof v === "object") {
            const name = String(
              (v as any).name ?? (v as any).label ?? (v as any).id ?? ""
            ).trim();
            const version =
              (v as any).version ?? (v as any).ver ?? (v as any).v ?? undefined;
            return name ? { name, version } : null;
          }
          return null;
        })
        .filter(Boolean) as TechItem[];
    } catch {
      return [];
    }
  };

  const aggregateTech = useMemo(() => {
    if (!analysisData) {
      return {
        languages: [] as TechItem[],
        frameworks: [] as TechItem[],
        libraries: [] as TechItem[],
        databases: [] as TechItem[],
        tools: [] as TechItem[],
        testing: [] as TechItem[],
        build: [] as TechItem[],
        deployment: [] as TechItem[],
        platforms: [] as TechItem[],
      };
    }

    const byKey = {
      languages: new Map<string, TechItem>(),
      frameworks: new Map<string, TechItem>(),
      libraries: new Map<string, TechItem>(),
      databases: new Map<string, TechItem>(),
      tools: new Map<string, TechItem>(),
      testing_frameworks: new Map<string, TechItem>(),
      build_tools: new Map<string, TechItem>(),
      deployment_tools: new Map<string, TechItem>(),
      platforms: new Map<string, TechItem>(),
    } as const;

    const addAll = (key: keyof typeof byKey, items: TechItem[]) => {
      items.forEach((it) => {
        const k = it.name.trim();
        if (!k) return;
        if (!byKey[key].has(k)) byKey[key].set(k, it);
      });
    };

    // 1) From each repo detailed analysis
    analysisData.repositoryAnalysis.detailedAnalyses?.forEach((d) => {
      const ts = d.analysis?.technology_stack || d.analysis?.tech_stack || {};
      addAll("languages", toTechItems(ts.languages));
      addAll("frameworks", toTechItems(ts.frameworks));
      addAll("libraries", toTechItems(ts.libraries));
      addAll("databases", toTechItems(ts.databases));
      addAll("tools", toTechItems(ts.tools));
      addAll("testing_frameworks", toTechItems(ts.testing_frameworks));
      addAll("build_tools", toTechItems(ts.build_tools));
      addAll("deployment_tools", toTechItems(ts.deployment_tools));
      addAll("platforms", toTechItems(ts.platforms));
    });

    // 2) From aggregated language expertise (just language names)
    analysisData.repositoryAnalysis.languageExpertise?.forEach((le) => {
      if (le.language) {
        const name = String(le.language).trim();
        if (name && !byKey.languages.has(name))
          byKey.languages.set(name, { name });
      }
    });

    return {
      languages: Array.from(byKey.languages.values()),
      frameworks: Array.from(byKey.frameworks.values()),
      libraries: Array.from(byKey.libraries.values()),
      databases: Array.from(byKey.databases.values()),
      tools: Array.from(byKey.tools.values()),
      testing: Array.from(byKey.testing_frameworks.values()),
      build: Array.from(byKey.build_tools.values()),
      deployment: Array.from(byKey.deployment_tools.values()),
      platforms: Array.from(byKey.platforms.values()),
    };
  }, [analysisData]);

  // Pre-compute summaries unconditionally to maintain hook order; return safe defaults when no data
  const projectAISummaries = useMemo(() => {
    if (!analysisData) return [] as { repoName: string; content: string }[];
    return (analysisData.repositoryAnalysis.detailedAnalyses || []).map(
      (repo) => {
        const ai = repo.analysis?.ai_insights || {};
        const code = ai.code_assessment
          ? `### Code Assessment\n\n${ai.code_assessment}`
          : "";
        const arch = ai.architecture_assessment
          ? `### Architecture\n\n${ai.architecture_assessment}`
          : "";
        const maint = ai.maintainability_assessment
          ? `### Maintainability\n\n${ai.maintainability_assessment}`
          : "";
        const improv = ai.improvement_areas
          ? `### Improvements\n\n${ai.improvement_areas}`
          : "";
        const strengths =
          Array.isArray(ai.strengths) && ai.strengths.length
            ? `### Strengths\n\n- ${ai.strengths.join("\n- ")}`
            : "";
        const content = [code, arch, maint, improv, strengths]
          .filter(Boolean)
          .join("\n\n");
        return {
          repoName: repo.repository.full_name || repo.repository.name,
          content: content || "No detailed AI summary available.",
        };
      }
    );
  }, [analysisData]);

  const overallProjectsSummary = useMemo(() => {
    if (!analysisData) return "";
    const totalRepos = analysisData.repositoryAnalysis.stats.totalRepos;
    const totalStars = analysisData.repositoryAnalysis.stats.totalStars;
    const langs = aggregateTech.languages.map((l) => l.name).slice(0, 8);
    const fws = aggregateTech.frameworks.map((f) => f.name).slice(0, 8);
    const libs = aggregateTech.libraries.map((l) => l.name).slice(0, 8);
    const lines = analysisData.repositoryAnalysis.stats.totalLinesOfCode;
    return [
      `Analyzed ${totalRepos} repositories accumulating ${lines ? lines.toLocaleString() + " lines of code" : "significant code volume"} and ${totalStars} stars.`,
      langs.length ? `Primary languages: ${langs.join(", ")}.` : "",
      fws.length ? `Key frameworks: ${fws.join(", ")}.` : "",
      libs.length ? `Core libraries/tools: ${libs.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }, [analysisData, aggregateTech]);

  if (loading || !analysisData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  const primaryLanguage = aggregateTech.languages[0]?.name;
  const linkToLanguage = (item: string): string | undefined => {
    const s = item.toLowerCase();
    const findLang = (names: string[]) =>
      aggregateTech.languages.find((l) => names.includes(l.name.toLowerCase()))
        ?.name;
    if (
      /react|next|vite|webpack|redux|tanstack|prisma|drizzle|express|nest|node|typescript|javascript|pnpm|bun|vitest|jest|playwright|cypress/.test(
        s
      )
    ) {
      return findLang(["typescript", "javascript"]) || primaryLanguage;
    }
    if (
      /django|fastapi|flask|pytorch|tensorflow|numpy|pandas|pytest|poetry/.test(
        s
      )
    )
      return findLang(["python"]);
    if (/spring|maven|gradle|junit/.test(s)) return findLang(["java"]);
    if (/go|gin/.test(s)) return findLang(["go"]);
    if (/rust|cargo/.test(s)) return findLang(["rust"]);
    if (/c#|dotnet|asp\.net/.test(s))
      return findLang(["c#", "csharp", ".net", "dotnet"]);
    return primaryLanguage;
  };

  const createRoadmapNodes = (): Node[] => {
    const layers: { key: string; label: string }[][] = [];
    const root: { key: string; label: string } = {
      key: "root",
      label: "All Projects Tech",
    };
    layers.push([root]);

    const langLayer = aggregateTech.languages.map((l, i) => ({
      key: `lang-${i}-${l.name}`,
      label: l.name,
    }));
    if (langLayer.length) layers.push(langLayer);

    const fwLayer = aggregateTech.frameworks.map((f, i) => ({
      key: `fw-${i}-${f.name}`,
      label: f.version ? `${f.name} v${f.version}` : f.name,
    }));
    if (fwLayer.length) layers.push(fwLayer);

    const libToolsLayer = [
      ...aggregateTech.libraries.map((l, i) => ({
        key: `lib-${i}-${l.name}`,
        label: l.version ? `${l.name} v${l.version}` : l.name,
      })),
      ...aggregateTech.tools.map((t, i) => ({
        key: `tool-${i}-${t.name}`,
        label: t.version ? `${t.name} v${t.version}` : t.name,
      })),
      ...aggregateTech.testing.map((t, i) => ({
        key: `test-${i}-${t.name}`,
        label: t.version ? `${t.name} v${t.version}` : t.name,
      })),
      ...aggregateTech.build.map((b, i) => ({
        key: `build-${i}-${b.name}`,
        label: b.version ? `${b.name} v${b.version}` : b.name,
      })),
    ];
    if (libToolsLayer.length) layers.push(libToolsLayer);

    const dbLayer = aggregateTech.databases.map((d, i) => ({
      key: `db-${i}-${d.name}`,
      label: d.version ? `${d.name} v${d.version}` : d.name,
    }));
    if (dbLayer.length) layers.push(dbLayer);

    const deployLayer = [
      ...aggregateTech.deployment.map((d, i) => ({
        key: `deploy-${i}-${d.name}`,
        label: d.name,
      })),
      ...aggregateTech.platforms.map((p, i) => ({
        key: `plat-${i}-${p.name}`,
        label: p.name,
      })),
    ];
    if (deployLayer.length) layers.push(deployLayer);

    const layerY = (idx: number) => 60 + idx * 90;
    const computeX = (count: number, i: number) => {
      const width = 800;
      const gap = count > 1 ? width / (count - 1) : 0;
      return (count > 1 ? i * gap : width / 2) - width / 2;
    };

    const nodes: Node[] = [];
    layers.forEach((items, li) => {
      items.forEach((it, i) => {
        const isRoot = it.key === "root";
        nodes.push({
          id: it.key,
          type: "default",
          position: { x: computeX(items.length, i), y: layerY(li) },
          data: { label: it.label },
          style: {
            background: isRoot ? "#4f46e5" : "white",
            border: `2px solid ${isRoot ? "#4f46e5" : "#3b82f6"}`,
            borderRadius: "8px",
            color: isRoot ? "white" : "#1f2937",
            fontSize: isRoot ? "14px" : "12px",
            fontWeight: 600,
            padding: 8,
            width: isRoot ? 200 : 160,
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
        });
      });
    });
    return nodes;
  };

  const createRoadmapEdges = (): Edge[] => {
    const edges: Edge[] = [];
    const primaryEdgeStyle = { stroke: "#3b82f6", strokeWidth: 2.5 } as const;
    const secondaryEdgeStyle = { stroke: "#8b5cf6", strokeWidth: 2.5 } as const;
    const dashedEdgeStyle = {
      stroke: "#10b981",
      strokeWidth: 2.5,
      strokeDasharray: "5 5",
    } as const;

    aggregateTech.languages.forEach((l, i) => {
      edges.push({
        id: `e-root-lang-${i}`,
        source: "root",
        target: `lang-${i}-${l.name}`,
        type: "smoothstep",
        animated: true,
        style: primaryEdgeStyle,
      });
    });

    aggregateTech.frameworks.forEach((f, i) => {
      const lang = linkToLanguage(f.name) || primaryLanguage || "lang-0";
      const langIdx = aggregateTech.languages.findIndex((l) => l.name === lang);
      const langId = langIdx >= 0 ? `lang-${langIdx}-${lang}` : "root";
      edges.push({
        id: `e-lang-fw-${i}`,
        source: langId,
        target: `fw-${i}-${f.name}`,
        type: "smoothstep",
        animated: true,
        style: primaryEdgeStyle,
      });
    });

    const connectToFrameworkOrLang = (name: string) => {
      const s = name.toLowerCase();
      const fwIndex = aggregateTech.frameworks.findIndex(
        (f) =>
          s.includes(f.name.toLowerCase()) ||
          f.name.toLowerCase().includes(name.toLowerCase())
      );
      if (fwIndex >= 0)
        return `fw-${fwIndex}-${aggregateTech.frameworks[fwIndex].name}`;
      const lang =
        linkToLanguage(name) ||
        primaryLanguage ||
        aggregateTech.languages[0]?.name;
      const li = aggregateTech.languages.findIndex((l) => l.name === lang);
      return li >= 0 ? `lang-${li}-${lang}` : "root";
    };

    const attach = (prefix: string, arr: TechItem[]) => {
      arr.forEach((it, i) => {
        const from = connectToFrameworkOrLang(it.name);
        const to = `${prefix}-${i}-${it.name}`;
        const style = ["lib", "tool", "test", "build"].includes(prefix)
          ? dashedEdgeStyle
          : secondaryEdgeStyle;
        edges.push({
          id: `e-${prefix}-${i}`,
          source: from,
          target: to,
          type: "smoothstep",
          style,
        });
      });
    };

    attach("lib", aggregateTech.libraries);
    attach("tool", aggregateTech.tools);
    attach("test", aggregateTech.testing);
    attach("build", aggregateTech.build);

    aggregateTech.databases.forEach((d, i) => {
      const serverFwIdx = aggregateTech.frameworks.findIndex((f) =>
        /express|nest|fastapi|django|spring|rails|laravel|gin/.test(
          f.name.toLowerCase()
        )
      );
      const source =
        serverFwIdx >= 0
          ? `fw-${serverFwIdx}-${aggregateTech.frameworks[serverFwIdx].name}`
          : "root";
      edges.push({
        id: `e-db-${i}`,
        source,
        target: `db-${i}-${d.name}`,
        type: "smoothstep",
        style: secondaryEdgeStyle,
      });
    });

    aggregateTech.deployment.forEach((d, i) => {
      edges.push({
        id: `e-deploy-${i}`,
        source: "root",
        target: `deploy-${i}-${d.name}`,
        type: "smoothstep",
        style: secondaryEdgeStyle,
      });
    });
    aggregateTech.platforms.forEach((p, i) => {
      const source = aggregateTech.deployment.length
        ? `deploy-0-${aggregateTech.deployment[0].name}`
        : "root";
      edges.push({
        id: `e-plat-${i}`,
        source,
        target: `plat-${i}-${p.name}`,
        type: "smoothstep",
        style: dashedEdgeStyle,
      });
    });

    return edges;
  };

  // Compute roadmap nodes without useMemo here to avoid adding hooks after early returns
  const roadmapNodes = createRoadmapNodes();
  const hasRoadmap = roadmapNodes.length > 0;

  // helper to show score safely
  const generalScore = leaderboard.score ?? analysisData?.overallScore ?? 0;
  const generalRank = leaderboard.rank;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="ghost"
                onClick={() => router.push(`/${params.username}`)}
                className="flex items-center gap-2"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Profile Analysis</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {analysisData.profileSummary.name}'s profile assessment
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end">
                {leaderboardLoading ? (
                  <Skeleton className="h-6 w-20 rounded-full" />
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-card-foreground shadow-sm">
                    Rank {generalRank != null ? `#${generalRank}` : 'N/A'}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">General Leaderboard</div>
              {isBatchSaving && (
                <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                  Saving projects...
                </div>
              )}
              {!isBatchSaving && batchSaveCount > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  ✓ {batchSaveCount} projects saved
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

  <div className="container mx-auto px-4 py-8">
        {/* Main Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 mb-6 w-full md:w-auto bg-muted/40">
            <TabsTrigger value="overview">
              <BarChart className="h-4 w-4 mr-2 hidden sm:inline" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects">
              <Github className="h-4 w-4 mr-2 hidden sm:inline" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="career">
              <Briefcase className="h-4 w-4 mr-2 hidden sm:inline" />
              Career
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="h-4 w-4 mr-2 hidden sm:inline" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Profile Summary */}
            <Card className="border-muted/60">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarFallback className="text-lg">
                      {analysisData.profileSummary.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {analysisData.profileSummary.name}
                      </h3>
                      <p className="text-muted-foreground">
                        @{analysisData.profileSummary.username}
                      </p>
                    </div>
                    
                    {analysisData.profileSummary.headline && (
                      <p className="text-primary font-medium">
                        {analysisData.profileSummary.headline}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      {analysisData.profileSummary.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {analysisData.profileSummary.location}
                        </div>
                      )}
                      {analysisData.profileSummary.college && (
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {analysisData.profileSummary.college}
                        </div>
                      )}
                      {analysisData.careerAnalysis.stats.currentRole && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {analysisData.careerAnalysis.stats.currentRole.jobTitle}
                        </div>
                      )}
                    </div>
                    
                    {analysisData.profileSummary.bio && (
                      <div className="bg-muted/30 p-3 rounded-lg text-sm">
                        {analysisData.profileSummary.bio}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center bg-muted/30 p-3 rounded-lg mt-2 md:mt-0">
                    <div className={`w-16 h-16 rounded-full ${getScoreColor(generalScore)} flex items-center justify-center text-white font-bold`}>
                      {generalScore}
                    </div>
                    <span className="text-xs mt-1 flex items-center gap-1">
                      General Score
                      {leaderboardLoading ? (
                        <Skeleton className="h-3 w-10 rounded" />
                      ) : (
                        <>{generalRank != null ? `· #${generalRank}` : '· N/A'}</>
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <Github className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-xl font-bold">{analysisData.repositoryAnalysis.stats.totalRepos}</div>
                  <div className="text-xs text-muted-foreground">Repositories</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <div className="text-xl font-bold">{analysisData.repositoryAnalysis.stats.totalStars}</div>
                  <div className="text-xs text-muted-foreground">Stars</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <Layers className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <div className="text-xl font-bold">
                    {analysisData.repositoryAnalysis.stats.totalLinesOfCode 
                      ? Math.round(analysisData.repositoryAnalysis.stats.totalLinesOfCode / 1000) + "K" 
                      : "-"}
                  </div>
                  <div className="text-xs text-muted-foreground">Lines of Code</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <GanttChart className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <div className="text-xl font-bold">{Math.round(analysisData.careerAnalysis.stats.totalYearsExperience)}</div>
                  <div className="text-xs text-muted-foreground">Years Experience</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Primary Tech & Language Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Language Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisData.repositoryAnalysis.languageExpertise.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analysisData.repositoryAnalysis.languageExpertise.slice(0, 5)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ language, percentage }) => `${language} ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="repositoryCount"
                          >
                            {analysisData.repositoryAnalysis.languageExpertise
                              .slice(0, 5)
                              .map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No language data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Technology Stack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Languages</h4>
                      <div className="flex flex-wrap gap-1">
                        {aggregateTech.languages.length ? (
                          aggregateTech.languages.map((l, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {l.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None detected</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Frameworks</h4>
                      <div className="flex flex-wrap gap-1">
                        {aggregateTech.frameworks.length ? (
                          aggregateTech.frameworks.map((f, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {f.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None detected</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Databases</h4>
                      <div className="flex flex-wrap gap-1">
                        {aggregateTech.databases.length ? (
                          aggregateTech.databases.map((d, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {d.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">None detected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Key Strengths */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisData.aiInsights.strengths.slice(0, 4).map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-900/10 rounded-lg"
                    >
                      <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROJECTS TAB */}
          <TabsContent value="projects" className="space-y-6">
            {/* Project Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Projects Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {overallProjectsSummary || "No overall summary available."}
                  </ReactMarkdown>
                </div>
                
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-primary">
                      {analysisData.repositoryAnalysis.stats.totalRepos}
                    </div>
                    <div className="text-xs text-muted-foreground">Repositories</div>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-yellow-500 flex items-center justify-center gap-1">
                      <Star className="h-4 w-4" />
                      {analysisData.repositoryAnalysis.stats.totalStars}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Stars</div>
                  </div>
                  
                  <div className="bg-muted/30 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-500 flex items-center justify-center gap-1">
                      <GitFork className="h-4 w-4" />
                      {analysisData.repositoryAnalysis.stats.totalForks}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Forks</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Repositories - Accordion Style */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Top Repositories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {analysisData.repositoryAnalysis.topRepositories.map((repo, index) => (
                    <AccordionItem key={index} value={`repo-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-left">{repo.name}</h4>
                            {repo.language && (
                              <Badge variant="secondary" className="text-xs">
                                {repo.language}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {repo.stars}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork className="h-3 w-3" />
                              {repo.forks}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-3">
                        <p className="text-sm text-muted-foreground">
                          {repo.description || "No description available"}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => window.open(repo.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Repository
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Detailed Repository Analyses - Also in Accordion */}
            {analysisData.repositoryAnalysis.detailedAnalyses &&
              analysisData.repositoryAnalysis.detailedAnalyses.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Detailed Project Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {analysisData.repositoryAnalysis.detailedAnalyses.map((repoAnalysis, index) => (
                      <AccordionItem key={index} value={`detailed-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="py-3 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-left">{repoAnalysis.repository.name}</h4>
                              {repoAnalysis.repository.language && (
                                <Badge variant="secondary" className="text-xs">
                                  {repoAnalysis.repository.language}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {repoAnalysis.repository.stars}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-1 pb-3">
                          <p className="text-sm text-muted-foreground">
                            {repoAnalysis.repository.description || "No description available"}
                          </p>
                          
                          {repoAnalysis.analysis && (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {/* Code Metrics */}
                              {repoAnalysis.analysis.metrics && (
                                <div className="bg-muted/30 p-2 rounded-lg">
                                  <h5 className="font-medium text-xs mb-1">Code Metrics</h5>
                                  <div className="space-y-1 text-xs">
                                    {repoAnalysis.analysis.metrics.total_lines && (
                                      <div>Lines: {repoAnalysis.analysis.metrics.total_lines.toLocaleString()}</div>
                                    )}
                                    {repoAnalysis.analysis.metrics.complexity && (
                                      <div>Complexity: {repoAnalysis.analysis.metrics.complexity}</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Quality Metrics */}
                              {repoAnalysis.analysis.quality && (
                                <div className="bg-muted/30 p-2 rounded-lg">
                                  <h5 className="font-medium text-xs mb-1">Quality</h5>
                                  <div className="space-y-1 text-xs">
                                    {repoAnalysis.analysis.quality.architecture_score && (
                                      <div>Architecture: {repoAnalysis.analysis.quality.architecture_score}%</div>
                                    )}
                                    {repoAnalysis.analysis.quality.documentation_coverage && (
                                      <div>Docs: {repoAnalysis.analysis.quality.documentation_coverage}%</div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Security */}
                              {repoAnalysis.analysis.security && (
                                <div className="bg-muted/30 p-2 rounded-lg">
                                  <h5 className="font-medium text-xs mb-1">Security</h5>
                                  <div className="space-y-1 text-xs">
                                    {repoAnalysis.analysis.security.security_score && (
                                      <div>Score: {repoAnalysis.analysis.security.security_score}%</div>
                                    )}
                                    {repoAnalysis.analysis.security.critical_issues && (
                                      <div>Issues: {repoAnalysis.analysis.security.critical_issues.length}</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* AI Insights */}
                          {repoAnalysis.analysis?.ai_insights && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg mt-2">
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="ai-insight">
                                  <AccordionTrigger className="text-xs font-medium text-blue-700 dark:text-blue-300 py-1">
                                    AI Assessment
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 text-xs">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {projectAISummaries[index]?.content || "No AI summary available."}
                                      </ReactMarkdown>
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(repoAnalysis.repository.url, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View on GitHub
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}
            
            {/* Technology Stack Roadmap */}
            {hasRoadmap && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GanttChart className="h-4 w-4" />
                    Technology Stack Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px] w-full bg-white rounded-md border border-gray-200 overflow-hidden">
                    <ReactFlowClient
                      nodes={roadmapNodes}
                      edges={createRoadmapEdges()}
                      fitView
                      fitViewOptions={{ padding: 0.2 }}
                      defaultEdgeOptions={{ style: { stroke: "#3b82f6", strokeWidth: 2 } }}
                      attributionPosition="bottom-left"
                      style={{ backgroundColor: "white" }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CAREER TAB */}
          <TabsContent value="career" className="space-y-6">
            {/* Career Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Career Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-muted/30 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-primary">
                        {Math.round(analysisData.careerAnalysis.stats.totalYearsExperience)}
                      </div>
                      <div className="text-xs text-muted-foreground">Years Experience</div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg text-center">
                      <div className="text-xl font-bold text-green-500">
                        {analysisData.careerAnalysis.stats.skillsCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Skills</div>
                    </div>
                  </div>

                  {analysisData.careerAnalysis.stats.currentRole && (
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <div className="text-xs font-medium text-primary">Current Role</div>
                      <div className="font-medium">
                        {analysisData.careerAnalysis.stats.currentRole.jobTitle}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        at {analysisData.careerAnalysis.stats.currentRole.companyName}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysisData.careerAnalysis.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-3 rounded-lg text-center mb-4">
                    <div className="text-xl font-bold text-blue-500">
                      {Math.round(analysisData.careerAnalysis.stats.totalEducationYears)}
                    </div>
                    <div className="text-xs text-muted-foreground">Years of Education</div>
                  </div>

                  {analysisData.careerAnalysis.stats.currentEducation && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg mb-4">
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Currently Studying
                      </div>
                      <div className="font-medium">
                        {analysisData.careerAnalysis.stats.currentEducation.degree ||
                          analysisData.careerAnalysis.stats.currentEducation.fieldOfStudy}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        at {analysisData.careerAnalysis.stats.currentEducation.institution}
                      </div>
                    </div>
                  )}

                  {/* Education List */}
                  {analysisData.careerAnalysis.education.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Education History</h4>
                      {analysisData.careerAnalysis.education.map((edu, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-3 py-1">
                          <div className="font-medium text-sm">{edu.institution}</div>
                          <div className="text-xs">{edu.degree || edu.fieldOfStudy}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(edu.startDate)} - {edu.current ? "Present" : edu.endDate ? formatDate(edu.endDate) : "N/A"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Experience Timeline */}
            {analysisData.careerAnalysis.experience.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Career Progression
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {analysisData.aiInsights.careerProgression}
                  </p>

                  <div className="space-y-3">
                    {analysisData.careerAnalysis.experience.map((exp, index) => (
                      <div key={index} className="flex gap-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-3 h-3 rounded-full ${exp.current ? "bg-green-500" : "bg-gray-400"}`}></div>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{exp.jobTitle}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {exp.companyName}
                            </span>
                            {exp.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {exp.location}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(exp.startDate)} - {exp.current ? "Present" : exp.endDate ? formatDate(exp.endDate) : "N/A"}
                          </div>

                          {exp.description && (
                            <Accordion type="single" collapsible className="w-full mt-2">
                              <AccordionItem value="description" className="border-none">
                                <AccordionTrigger className="py-1 text-xs text-primary">
                                  View Description
                                </AccordionTrigger>
                                <AccordionContent>
                                  <p className="text-xs text-muted-foreground">{exp.description}</p>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* INSIGHTS TAB */}
          <TabsContent value="insights" className="space-y-6">
            {/* Strengths */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Strengths & Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisData.aiInsights.strengths.map((strength, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"
                    >
                      <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{strength}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Skill Gaps & Areas for Improvement */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisData.aiInsights.skillGaps.map((gap, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg"
                    >
                      <Target className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{gap}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisData.aiInsights.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg"
                    >
                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* General Leaderboard */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  General Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-16 h-16 rounded-full ${getScoreColor(generalScore)} flex items-center justify-center text-white font-bold`}>
                    {generalScore}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-primary">{generalScore}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                      Rank
                      {leaderboardLoading ? (
                        <Skeleton className="h-3 w-12 rounded" />
                      ) : (
                        <span className="font-medium">{generalRank != null ? `#${generalRank}` : 'N/A'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overall Score Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Overall Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-16 h-16 rounded-full ${getScoreColor(analysisData.overallScore)} flex items-center justify-center text-white font-bold`}>
                    {analysisData.overallScore}
                  </div>
                  <div className="flex-1">
                    <div className="text-xl font-bold text-primary mb-1">
                      {analysisData.overallScore}/100
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Professional Profile Rating
                    </div>
                  </div>
                </div>

                <Progress value={analysisData.overallScore} className="h-2 mb-4" />

                <p className="text-sm text-muted-foreground">
                  This score is calculated based on repository activity, career
                  experience, profile completeness, and educational background.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-muted/30 p-2 rounded-lg text-center">
                    <div className="text-sm font-medium">Code Quality</div>
                    <div className="text-lg font-bold text-primary">
                      {analysisData.repositoryAnalysis.stats.averageQuality || "N/A"}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-2 rounded-lg text-center">
                    <div className="text-sm font-medium">Tech Breadth</div>
                    <div className="text-lg font-bold text-primary">
                      {aggregateTech.languages.length + aggregateTech.frameworks.length}
                    </div>
                  </div>

                  <div className="bg-muted/30 p-2 rounded-lg text-center">
                    <div className="text-sm font-medium">Experience</div>
                    <div className="text-lg font-bold text-primary">
                      {Math.round(analysisData.careerAnalysis.stats.totalYearsExperience)}yr
                    </div>
                  </div>

                  <div className="bg-muted/30 p-2 rounded-lg text-center">
                    <div className="text-sm font-medium">Community</div>
                    <div className="text-lg font-bold text-primary">
                      {analysisData.repositoryAnalysis.stats.totalStars}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground mt-6">
          Analysis completed on{" "}
          {new Date(analysisData.generatedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileAnalysisResults;
