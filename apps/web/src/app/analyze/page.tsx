"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@0unveiled/ui/components/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface AnalysisResult {
  success: boolean;
  data: {
    repository: {
      full_name: string;
      description: string;
      stars: number;
      forks: number;
      language: string;
      size: number;
    };
    metrics: {
      lines_of_code: number;
      total_lines: number;
      complexity: number;
      maintainability: number;
      technical_debt: number;
      files_analyzed: number;
    };
    quality: {
      documentation_coverage: number;
      architecture_score: number;
      test_files: number;
    };
    security: {
      security_score: number;
      critical_issues: number;
      security_hotspots: number;
    };
    ai_insights: {
      overall_score: number;
      code_assessment: string;
      architecture_assessment: string;
      strengths: string[];
      project_maturity: string;
    };
    project_summary: string;
    overall_score: number;
    analysis_duration: number;
    files_discovered: Array<{
      path: string;
      name: string;
      analyzed: boolean;
    }>;
  };
}

export default function AnalyzePage() {
  const [user, setUser] = useState<any>(null);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanningAll, setScanningAll] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [allAnalyses, setAllAnalyses] = useState<{
    [key: string]: AnalysisResult;
  }>({});
  const [error, setError] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [currentScanRepo, setCurrentScanRepo] = useState<string>("");
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const cancelScanRef = useRef<boolean>(false);

  useEffect(() => {
    if (userId) {
      loadRepositories();
    }
  }, [userId]);

  const loadRepositories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/github/supabase/repositories/${userId}?type=owner&sort=updated&direction=desc&per_page=50`,
      );
      const data = await response.json();

      if (data.success) {
        setRepositories(data.data);
      } else {
        setError(data.error || "Failed to load repositories");
      }
    } catch (err) {
      setError("Failed to connect to GitHub. Please check your connection.");
      console.error("Repository loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeRepository = async (repo: Repository) => {
    if (!repo) return;

    setAnalyzing(true);
    setError("");
    setAnalysis(null);

    try {
      const [owner, repoName] = repo.full_name.split("/");

      const response = await fetch(
        `/api/github/supabase/analyze/${userId}/${owner}/${repoName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            max_files: 200,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setAnalysis(data);
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch (err) {
      setError("Analysis failed. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const cancelScan = () => {
    cancelScanRef.current = true;
    setScanningAll(false);
    setCurrentScanRepo("");
    console.log("📢 Scan cancelled by user");
  };

  const toggleRepoSelection = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const selectAllRepos = () => {
    const allRepoIds = new Set(repositories.map((repo) => repo.id));
    setSelectedRepos(allRepoIds);
  };

  const clearSelection = () => {
    setSelectedRepos(new Set());
  };

  const scanSelectedRepositories = async () => {
    const selectedRepoList = repositories.filter((repo) =>
      selectedRepos.has(repo.id),
    );
    if (!selectedRepoList.length) return;

    await scanRepositories(
      selectedRepoList,
      `selected repositories (${selectedRepoList.length})`,
    );
  };

  const scanAllRepositories = async () => {
    if (!repositories.length) return;

    await scanRepositories(
      repositories,
      `all repositories (${repositories.length})`,
    );
  };

  const scanRepositories = async (
    reposToScan: Repository[],
    scanType: string,
  ) => {
    cancelScanRef.current = false;
    setScanningAll(true);
    setError("");
    setAllAnalyses({});
    setAnalysis(null);

    const analyses: { [key: string]: AnalysisResult } = {};
    let successCount = 0;
    let failureCount = 0;

    console.log(`🚀 Starting scan of ${scanType}`);

    for (let i = 0; i < reposToScan.length; i++) {
      // Check if user cancelled the scan
      if (cancelScanRef.current) {
        setError(
          `Scan cancelled after analyzing ${i} repositories. ${successCount} successful, ${failureCount} failed.`,
        );
        break;
      }

      const repo = reposToScan[i];
      setCurrentScanRepo(
        `${repo.name} (${i + 1}/${reposToScan.length}) - ${successCount} success, ${failureCount} failed`,
      );

      try {
        const [owner, repoName] = repo.full_name.split("/");

        console.log(`🔍 Starting analysis for ${repo.full_name}...`);

        // Add timeout to prevent hanging on slow analyses
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

        const response = await fetch(
          `/api/github/supabase/analyze/${userId}/${owner}/${repoName}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              max_files: 50, // Reduced from 200 to speed up analysis
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        console.log(
          `📡 API response status for ${repo.full_name}:`,
          response.status,
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `❌ HTTP Error ${response.status} for ${repo.full_name}:`,
            errorText,
          );
          failureCount++;
          continue;
        }

        const data = await response.json();
        console.log(`📊 Analysis data for ${repo.full_name}:`, {
          success: data.success,
          hasData: !!data.data,
          error: data.error,
        });

        if (data.success && data.data) {
          analyses[repo.full_name] = data;
          successCount++;
          console.log(`✅ Successfully analyzed ${repo.full_name}`);
        } else {
          failureCount++;
          console.error(
            `❌ Failed to analyze ${repo.full_name}:`,
            data.error || "Unknown error",
          );
        }
      } catch (err) {
        failureCount++;
        if (err.name === "AbortError") {
          console.error(`⏰ Analysis timed out for ${repo.full_name}`);
        } else {
          console.error(`❌ Error analyzing ${repo.full_name}:`, err);
          console.error(`❌ Error details:`, {
            message: err.message,
            stack: err.stack,
            name: err.name,
          });
        }
      }

      // Update analyses in real-time so user can see progress
      setAllAnalyses({ ...analyses });

      // Small delay between requests to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setAllAnalyses(analyses);
    setScanningAll(false);
    setCurrentScanRepo("");

    // Show final summary (only if not cancelled)
    if (!cancelScanRef.current) {
      const totalRepos = reposToScan.length;
      const message = `Scan of ${scanType} completed: ${successCount}/${totalRepos} repositories analyzed successfully`;
      if (failureCount > 0) {
        setError(
          `${message}. ${failureCount} repositories failed to analyze (check console for details).`,
        );
      } else {
        console.log(`🎉 ${message}`);
      }
    }
  };

  const formatScore = (score: number) => {
    return Math.round(score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const generateOverallInsights = (analyses: {
    [key: string]: AnalysisResult;
  }) => {
    const repoCount = Object.keys(analyses).length;
    if (repoCount < 2) return null; // Only show for 2+ repositories

    // Collect all data
    const languages = new Map<string, number>();
    const languageRepos = new Map<string, string[]>(); // Track which repos use each language
    const techStack = new Map<
      string,
      { count: number; repos: string[]; category: string }
    >();
    const totalScores = [];
    const totalLinesOfCode = [];
    const totalSecurity = [];
    const allStrengths = [];
    const projectTypes = new Set<string>();

    Object.entries(analyses).forEach(([repoName, analysis]) => {
      if (!analysis.data) return;

      // Language analysis
      if (analysis.data.repository.language) {
        const lang = analysis.data.repository.language;
        languages.set(lang, (languages.get(lang) || 0) + 1);

        // Track which repos use this language
        if (!languageRepos.has(lang)) {
          languageRepos.set(lang, []);
        }
        languageRepos.get(lang)!.push(repoName.split("/")[1]); // Get repo name without owner
      }

      // Tech stack analysis - extract from AI insights and repository data
      const repoShortName = repoName.split("/")[1];
      const description =
        analysis.data.repository.description?.toLowerCase() || "";
      const lang = analysis.data.repository.language;

      // Helper function to add tech to stack
      const addTech = (tech: string, category: string) => {
        if (!techStack.has(tech)) {
          techStack.set(tech, { count: 0, repos: [], category });
        }
        const current = techStack.get(tech)!;
        current.count++;
        if (!current.repos.includes(repoShortName)) {
          current.repos.push(repoShortName);
        }
      };

      // Language-based tech detection
      if (lang) {
        switch (lang.toLowerCase()) {
          case "javascript":
          case "typescript":
            addTech("Frontend", "Web Development");
            if (
              description.includes("react") ||
              repoName.toLowerCase().includes("react")
            ) {
              addTech("React", "Frontend");
            }
            if (
              description.includes("next") ||
              repoName.toLowerCase().includes("next")
            ) {
              addTech("Next.js", "Frontend");
            }
            if (
              description.includes("node") ||
              repoName.toLowerCase().includes("node")
            ) {
              addTech("Backend", "Server Development");
              addTech("Express", "Backend");
            }
            break;
          case "python":
            addTech("Machine Learning", "AI/ML");
            if (
              description.includes("ml") ||
              description.includes("ai") ||
              description.includes("data")
            ) {
              addTech("Deep Learning", "Machine Learning");
              addTech("Supervised Learning", "Machine Learning");
              addTech("NumPy", "Machine Learning");
              addTech("Pandas", "Machine Learning");
            }
            if (
              description.includes("pytorch") ||
              repoName.toLowerCase().includes("pytorch")
            ) {
              addTech("PyTorch", "Machine Learning");
            }
            if (
              description.includes("flask") ||
              description.includes("django")
            ) {
              addTech("Backend", "Server Development");
            }
            break;
          case "java":
            addTech("Backend", "Server Development");
            addTech("Microservices", "Backend");
            break;
          case "go":
            addTech("Backend", "Server Development");
            addTech("Microservices", "Backend");
            break;
        }
      }

      // Description-based tech detection
      if (description.includes("api") || description.includes("backend")) {
        addTech("API Development", "Backend");
        addTech("RESTful", "Backend");
      }
      if (description.includes("docker") || description.includes("devops")) {
        addTech("DevOps", "Infrastructure");
        addTech("Embedded Systems", "DevOps");
      }
      if (description.includes("database") || description.includes("sql")) {
        addTech("SQL", "Backend");
        addTech("MongoDB", "Backend");
      }
      if (description.includes("web") || description.includes("frontend")) {
        addTech("Frontend", "Web Development");
        addTech("UI Development", "Frontend");
        addTech("CSS Styling", "Frontend");
      }
      if (description.includes("mobile") || description.includes("app")) {
        addTech("Mobile Development", "Mobile");
      }
      if (description.includes("security")) {
        addTech("Security & Compliance", "Security");
      }
      if (description.includes("socket") || description.includes("websocket")) {
        addTech("WebSocket", "Backend");
      }
      if (
        description.includes("data visualization") ||
        description.includes("chart")
      ) {
        addTech("Data Visualization", "Data Science");
      }
      if (description.includes("time series")) {
        addTech("Time Series Analysis", "Data Science");
      }

      // Scores
      totalScores.push(analysis.data.overall_score);
      totalLinesOfCode.push(analysis.data.metrics.lines_of_code);
      totalSecurity.push(analysis.data.security.security_score);

      // Strengths
      if (analysis.data.ai_insights?.strengths) {
        allStrengths.push(...analysis.data.ai_insights.strengths);
      }

      // Project type detection based on repo name and description
      const repoFullName = analysis.data.repository.full_name.toLowerCase();
      const repoDescription =
        analysis.data.repository.description?.toLowerCase() || "";

      if (
        repoFullName.includes("web") ||
        repoFullName.includes("site") ||
        repoFullName.includes("frontend") ||
        repoDescription.includes("web") ||
        repoDescription.includes("frontend") ||
        repoDescription.includes("react") ||
        repoDescription.includes("vue") ||
        repoDescription.includes("angular")
      ) {
        projectTypes.add("Web Development");
      }
      if (
        repoFullName.includes("ml") ||
        repoFullName.includes("ai") ||
        repoFullName.includes("data") ||
        repoDescription.includes("machine learning") ||
        repoDescription.includes("data science") ||
        repoDescription.includes("neural") ||
        repoDescription.includes("tensorflow") ||
        repoDescription.includes("pytorch")
      ) {
        projectTypes.add("Machine Learning");
      }
      if (
        repoFullName.includes("api") ||
        repoFullName.includes("server") ||
        repoFullName.includes("backend") ||
        repoDescription.includes("api") ||
        repoDescription.includes("backend") ||
        repoDescription.includes("server")
      ) {
        projectTypes.add("Backend Development");
      }
      if (
        repoFullName.includes("mobile") ||
        repoFullName.includes("ios") ||
        repoFullName.includes("android") ||
        repoDescription.includes("mobile") ||
        repoDescription.includes("react native") ||
        repoDescription.includes("flutter")
      ) {
        projectTypes.add("Mobile Development");
      }
      if (
        repoFullName.includes("devops") ||
        repoFullName.includes("docker") ||
        repoFullName.includes("deploy") ||
        repoDescription.includes("devops") ||
        repoDescription.includes("deployment") ||
        repoDescription.includes("ci/cd")
      ) {
        projectTypes.add("DevOps");
      }
    });

    // Calculate averages
    const avgScore =
      totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
    const avgSecurity =
      totalSecurity.reduce((a, b) => a + b, 0) / totalSecurity.length;
    const totalLines = totalLinesOfCode.reduce((a, b) => a + b, 0);

    // Top languages
    const topLanguages = Array.from(languages.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => ({
        language: lang,
        count,
        percentage: Math.round((count / repoCount) * 100),
      }));

    // Generate insights
    const insights = [];

    // Language expertise
    if (topLanguages.length > 0) {
      const primaryLang = topLanguages[0];
      if (primaryLang.percentage >= 60) {
        insights.push(
          `Specializes primarily in ${primaryLang.language} development`,
        );
      } else if (topLanguages.length >= 3) {
        insights.push(
          `Multi-language developer proficient in ${topLanguages
            .slice(0, 3)
            .map((l) => l.language)
            .join(", ")}`,
        );
      } else {
        insights.push(
          `Experienced in ${topLanguages.map((l) => l.language).join(" and ")} development`,
        );
      }
    }

    // Project types
    if (projectTypes.size > 0) {
      insights.push(`Active in: ${Array.from(projectTypes).join(", ")}`);
    }

    // Code quality assessment
    if (avgScore >= 75) {
      insights.push("Consistently writes high-quality, maintainable code");
    } else if (avgScore >= 60) {
      insights.push(
        "Demonstrates solid coding practices with room for improvement",
      );
    }

    // Security awareness
    if (avgSecurity >= 80) {
      insights.push("Strong security-conscious development approach");
    } else if (avgSecurity >= 60) {
      insights.push("Maintains good security practices");
    }

    // Productivity assessment
    if (totalLines > 50000) {
      insights.push(
        "Highly productive developer with substantial codebase contributions",
      );
    } else if (totalLines > 10000) {
      insights.push("Active developer with solid contribution history");
    }

    // Process tech stack data
    const techStackArray = Array.from(techStack.entries())
      .map(([tech, data]) => ({
        name: tech,
        count: data.count,
        repos: data.repos,
        category: data.category,
        percentage: Math.round((data.count / repoCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      overallScore: Math.round(avgScore),
      repoCount,
      topLanguages,
      languageRepos: Object.fromEntries(languageRepos), // Convert Map to object for easier use in JSX
      techStack: techStackArray,
      projectTypes: Array.from(projectTypes),
      insights,
      totalLinesOfCode: totalLines,
      avgSecurity: Math.round(avgSecurity),
    };
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Repository Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analyze your GitHub repositories with AI-powered insights
          </p>
        </div>

        {/* User ID Input */}
        <div className="mb-12 bg-white border border-gray-200 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            User Authentication
          </h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Enter your User ID from our database"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent text-lg"
            />
            <Button
              onClick={() => userId && loadRepositories()}
              disabled={!userId || loading}
              className="px-8 py-4 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300 text-lg font-medium"
            >
              {loading ? "Loading..." : "Load Repos"}
            </Button>
          </div>
          <p className="text-gray-500 mt-4">
            Enter your User ID from our database to access your GitHub
            repositories via OAuth
          </p>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
            {error}
          </div>
        )}

        {userId && (
          <div className="space-y-8">
            {/* Repository Selection Row */}
            <div className="w-full">
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Your Repositories
                  </h2>
                  <div className="flex space-x-3">
                    <Button
                      onClick={loadRepositories}
                      disabled={loading || scanningAll}
                      className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
                    >
                      {loading ? "Loading..." : "Refresh"}
                    </Button>
                    {repositories.length > 0 && (
                      <>
                        {!scanningAll ? (
                          <>
                            <Button
                              onClick={scanAllRepositories}
                              disabled={loading}
                              className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300"
                            >
                              Scan All ({repositories.length})
                            </Button>
                            {selectedRepos.size > 0 && (
                              <Button
                                onClick={scanSelectedRepositories}
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300"
                              >
                                Scan Selected ({selectedRepos.size})
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            onClick={cancelScan}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                          >
                            Cancel Scan
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {scanningAll && (
                  <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-blue-800 font-semibold text-lg">
                          Bulk Repository Analysis
                        </span>
                      </div>
                      <Button
                        onClick={cancelScan}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 border border-red-300"
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="text-blue-700 font-medium mb-2">
                      Currently analyzing: {currentScanRepo}
                    </div>
                    <div className="text-sm text-blue-600">
                      Each repository takes 30-60 seconds to analyze. You can
                      cancel at any time and view partial results.
                    </div>
                    {Object.keys(allAnalyses).length > 0 && (
                      <div className="mt-3 text-sm text-green-700">
                        ✓ {Object.keys(allAnalyses).length} repositories
                        analyzed so far
                      </div>
                    )}
                  </div>
                )}

                {repositories.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {selectedRepos.size > 0
                          ? `${selectedRepos.size} of ${repositories.length} repositories selected`
                          : "Select repositories to scan specific ones"}
                      </div>
                      <div className="flex space-x-2">
                        {selectedRepos.size > 0 && (
                          <Button
                            onClick={clearSelection}
                            className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600"
                          >
                            Clear
                          </Button>
                        )}
                        <Button
                          onClick={selectAllRepos}
                          disabled={selectedRepos.size === repositories.length}
                          className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                        >
                          Select All
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-96 overflow-y-auto">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className={`p-4 border-2 rounded-2xl transition-all ${
                        selectedRepo?.id === repo.id
                          ? "border-black bg-gray-50"
                          : selectedRepos.has(repo.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedRepos.has(repo.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleRepoSelection(repo.id);
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedRepo(repo)}
                        >
                          <div className="font-semibold text-gray-900 text-base truncate">
                            {repo.name}
                          </div>
                          {repo.description && (
                            <div className="text-gray-600 mt-2 text-xs line-clamp-2">
                              {repo.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-3 mt-3 text-xs text-gray-500">
                            {repo.language && (
                              <span className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                {repo.language}
                              </span>
                            )}
                            <span>⭐ {repo.stargazers_count}</span>
                            <span>🍴 {repo.forks_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRepo && (
                  <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                    <Button
                      onClick={() => analyzeRepository(selectedRepo)}
                      disabled={analyzing || scanningAll}
                      className="px-8 py-3 bg-black text-white rounded-xl hover:bg-gray-800 disabled:bg-gray-300 font-medium"
                    >
                      {analyzing
                        ? "Analyzing..."
                        : scanningAll
                          ? "Scanning All..."
                          : `Analyze ${selectedRepo.name}`}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Results Row */}
            <div className="w-full">
              {analysis ? (
                /* Individual Repository Analysis */
                <div className="space-y-8">
                  {/* Back to Summary Button */}
                  {Object.keys(allAnalyses).length > 0 && (
                    <Button
                      onClick={() => {
                        setAnalysis(null);
                        setSelectedRepo(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
                    >
                      ← Back to All Repositories Summary
                    </Button>
                  )}
                  {/* Repository Overview */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                      Repository Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {analysis.data.repository.stars}
                        </div>
                        <div className="text-gray-600">Stars</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {analysis.data.repository.forks}
                        </div>
                        <div className="text-gray-600">Forks</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {analysis.data.repository.language || "Mixed"}
                        </div>
                        <div className="text-gray-600">Language</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-3xl font-bold text-gray-900 mb-2">
                          {(analysis.data.repository.size / 1024).toFixed(1)} MB
                        </div>
                        <div className="text-gray-600">Size</div>
                      </div>
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                      Overall Score
                    </h3>
                    <div className="text-center mb-8">
                      <div
                        className={`text-7xl font-bold ${getScoreColor(analysis.data.overall_score)} mb-4`}
                      >
                        {formatScore(analysis.data.overall_score)}
                      </div>
                      <div className="text-xl text-gray-600">
                        Repository Quality Score
                      </div>
                    </div>

                    {analysis.data.project_summary && (
                      <div className="p-6 bg-gray-50 rounded-2xl border-l-4 border-gray-900">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Project Summary
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {analysis.data.project_summary}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Code Metrics */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                      Code Metrics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {analysis.data.metrics.total_lines.toLocaleString()}
                        </div>
                        <div className="text-gray-600">Total Lines</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {analysis.data.metrics.lines_of_code.toLocaleString()}
                        </div>
                        <div className="text-gray-600">Lines of Code</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {analysis.data.metrics.complexity.toFixed(1)}
                        </div>
                        <div className="text-gray-600">Complexity</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {analysis.data.metrics.maintainability.toFixed(1)}
                        </div>
                        <div className="text-gray-600">Maintainability</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {(analysis.data.metrics.technical_debt * 100).toFixed(
                            1,
                          )}
                          %
                        </div>
                        <div className="text-gray-600">Technical Debt</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {analysis.data.metrics.files_analyzed}
                        </div>
                        <div className="text-gray-600">Files Analyzed</div>
                      </div>
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                      Quality Metrics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div
                          className={`text-3xl font-bold ${getScoreColor(analysis.data.quality.documentation_coverage)} mb-3`}
                        >
                          {analysis.data.quality.documentation_coverage}%
                        </div>
                        <div className="text-gray-600">
                          Documentation Coverage
                        </div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div
                          className={`text-3xl font-bold ${getScoreColor(analysis.data.quality.architecture_score)} mb-3`}
                        >
                          {analysis.data.quality.architecture_score}
                        </div>
                        <div className="text-gray-600">Architecture Score</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-3xl font-bold text-gray-900 mb-3">
                          {analysis.data.quality.test_files}
                        </div>
                        <div className="text-gray-600">Test Files</div>
                      </div>
                    </div>
                  </div>

                  {/* Security Analysis */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                      Security Analysis
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div
                          className={`text-3xl font-bold ${getScoreColor(analysis.data.security.security_score)} mb-3`}
                        >
                          {formatScore(analysis.data.security.security_score)}
                        </div>
                        <div className="text-gray-600">Security Score</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-3xl font-bold text-red-600 mb-3">
                          {analysis.data.security.critical_issues}
                        </div>
                        <div className="text-gray-600">Critical Issues</div>
                      </div>
                      <div className="text-center p-6 bg-gray-50 rounded-xl">
                        <div className="text-3xl font-bold text-orange-600 mb-3">
                          {analysis.data.security.security_hotspots}
                        </div>
                        <div className="text-gray-600">Security Hotspots</div>
                      </div>
                    </div>

                    {(analysis.data.security.critical_issues > 0 ||
                      analysis.data.security.security_hotspots > 0) && (
                      <div className="mt-6 p-6 bg-red-50 rounded-2xl border-l-4 border-red-500">
                        <h5 className="font-semibold text-red-900 mb-3">
                          Security Attention Required
                        </h5>
                        <p className="text-red-700">
                          {analysis.data.security.critical_issues > 0 &&
                            `${analysis.data.security.critical_issues} critical security issues found. `}
                          {analysis.data.security.security_hotspots > 0 &&
                            `${analysis.data.security.security_hotspots} security hotspots need review.`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI Analysis */}
                  {analysis.data.project_overview && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-8">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                        AI Analysis
                      </h3>

                      <div className="space-y-8">
                        {/* Raw AI Analysis */}
                        <div className="p-6 bg-gray-50 rounded-2xl">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4">
                            Detailed Code Analysis
                          </h5>
                          <div className="text-gray-700 whitespace-pre-line bg-white p-6 rounded-xl border border-gray-200 leading-relaxed">
                            {analysis.data.project_overview.raw_ai_analysis}
                          </div>
                        </div>

                        {/* Architecture Insights */}
                        <div className="p-6 bg-gray-50 rounded-2xl">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4">
                            Architecture & Design Insights
                          </h5>
                          <div className="text-gray-700 whitespace-pre-line bg-white p-6 rounded-xl border border-gray-200 leading-relaxed">
                            {analysis.data.project_overview.detailed_insights}
                          </div>
                        </div>

                        {/* AI Recommendations */}
                        <div className="p-6 bg-gray-50 rounded-2xl">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4">
                            AI Recommendations
                          </h5>
                          <div className="text-gray-700 whitespace-pre-line bg-white p-6 rounded-xl border border-gray-200 leading-relaxed">
                            {
                              analysis.data.project_overview
                                .gemini_recommendations
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Insights */}
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                      AI Insights Summary
                    </h3>

                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-2xl border-l-4 border-gray-900">
                        <h5 className="text-lg font-semibold text-gray-900 mb-3">
                          Code Quality Assessment
                        </h5>
                        <p className="text-gray-700 leading-relaxed">
                          {analysis.data.ai_insights.code_assessment}
                        </p>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl border-l-4 border-gray-900">
                        <h5 className="text-lg font-semibold text-gray-900 mb-3">
                          Architecture Analysis
                        </h5>
                        <p className="text-gray-700 leading-relaxed">
                          {analysis.data.ai_insights.architecture_assessment}
                        </p>
                      </div>

                      {analysis.data.ai_insights.strengths &&
                        analysis.data.ai_insights.strengths.length > 0 && (
                          <div className="p-6 bg-gray-50 rounded-2xl border-l-4 border-gray-900">
                            <h5 className="text-lg font-semibold text-gray-900 mb-3">
                              Key Strengths
                            </h5>
                            <ul className="space-y-2">
                              {analysis.data.ai_insights.strengths.map(
                                (strength, index) => (
                                  <li
                                    key={index}
                                    className="text-gray-700 flex items-start"
                                  >
                                    <span className="text-green-500 mr-3 mt-1">
                                      ✓
                                    </span>
                                    {strength}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}

                      {analysis.data.ai_insights.project_maturity && (
                        <div className="p-6 bg-gray-50 rounded-2xl border-l-4 border-gray-900">
                          <h5 className="text-lg font-semibold text-gray-900 mb-3">
                            Project Maturity
                          </h5>
                          <p className="text-gray-700 leading-relaxed">
                            {analysis.data.ai_insights.project_maturity}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Files Discovered */}
                  {analysis.data.files_discovered &&
                    analysis.data.files_discovered.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                          Files Discovered
                        </h3>
                        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                              {analysis.data.files_discovered.length}
                            </div>
                            <div className="text-gray-600">Total Files</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-green-600 mb-2">
                              {
                                analysis.data.files_discovered.filter(
                                  (f: any) => f.analyzed,
                                ).length
                              }
                            </div>
                            <div className="text-gray-600">Analyzed</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-orange-600 mb-2">
                              {
                                analysis.data.files_discovered.filter(
                                  (f: any) => !f.analyzed,
                                ).length
                              }
                            </div>
                            <div className="text-gray-600">Skipped</div>
                          </div>
                          <div className="text-center p-6 bg-gray-50 rounded-xl">
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                              {Math.round(
                                (analysis.data.files_discovered.filter(
                                  (f: any) => f.analyzed,
                                ).length /
                                  analysis.data.files_discovered.length) *
                                  100,
                              )}
                              %
                            </div>
                            <div className="text-gray-600">Coverage</div>
                          </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {analysis.data.files_discovered.map(
                              (file: any, index: number) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg text-sm flex items-center transition-all hover:shadow-sm ${
                                    file.analyzed
                                      ? "bg-green-50 text-green-800 border border-green-200 hover:bg-green-100"
                                      : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                                  }`}
                                >
                                  <span className="mr-3 text-lg">
                                    {file.analyzed ? "✅" : "❌"}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className="font-medium truncate"
                                      title={file.name}
                                    >
                                      {file.name}
                                    </div>
                                    <div
                                      className="text-xs opacity-75 truncate"
                                      title={file.path}
                                    >
                                      {file.path}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Analysis Duration */}
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      Analysis completed in{" "}
                      {analysis.data.analysis_duration.toFixed(1)} seconds
                    </p>
                  </div>
                </div>
              ) : Object.keys(allAnalyses).length > 0 ? (
                /* All Repositories Summary View */
                <div className="space-y-8">
                  {/* Multi-Repository General Overview */}
                  {(() => {
                    const overallInsights =
                      generateOverallInsights(allAnalyses);
                    return overallInsights ? (
                      <div className="bg-white border border-gray-200 rounded-2xl p-8">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                          Developer Profile Overview
                        </h3>

                        {/* Overall Score */}
                        <div className="text-center mb-8">
                          <div
                            className={`text-6xl font-bold ${getScoreColor(overallInsights.overallScore)} mb-3`}
                          >
                            {overallInsights.overallScore}
                          </div>
                          <div className="text-xl text-gray-600">
                            Combined Score from {overallInsights.repoCount}{" "}
                            Repositories
                          </div>
                        </div>

                        {/* Key Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Developer Profile
                            </h4>
                            <div className="space-y-3">
                              {overallInsights.insights.map(
                                (insight, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start p-4 bg-gray-50 rounded-xl border border-gray-200"
                                  >
                                    <div className="w-2 h-2 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                      {insight}
                                    </p>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Technical Summary
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                  {overallInsights.totalLinesOfCode.toLocaleString()}
                                </div>
                                <div className="text-gray-600 text-sm">
                                  Total Lines of Code
                                </div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <div
                                  className={`text-2xl font-bold ${getScoreColor(overallInsights.avgSecurity)} mb-1`}
                                >
                                  {overallInsights.avgSecurity}
                                </div>
                                <div className="text-gray-600 text-sm">
                                  Avg Security Score
                                </div>
                              </div>
                            </div>

                            {/* Top Languages */}
                            <div className="space-y-3">
                              <h5 className="text-sm font-semibold text-gray-700">
                                Primary Languages
                              </h5>
                              <div className="space-y-2">
                                {overallInsights.topLanguages
                                  .slice(0, 4)
                                  .map((lang, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200"
                                    >
                                      <span className="text-gray-900 font-medium text-sm">
                                        {lang.language}
                                      </span>
                                      <span className="text-gray-600 text-sm">
                                        {lang.percentage}% ({lang.count} repos)
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Project Types */}
                            {overallInsights.projectTypes.length > 0 && (
                              <div className="space-y-3">
                                <h5 className="text-sm font-semibold text-gray-700">
                                  Expertise Areas
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {overallInsights.projectTypes.map(
                                    (type, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1 bg-black text-white rounded-full text-xs font-medium"
                                      >
                                        {type}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Languages Chart */}
                        <div className="mt-8 space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Language Distribution
                          </h4>
                          <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            {(() => {
                              // Prepare data for the chart
                              const chartData =
                                overallInsights.topLanguages.map(
                                  (lang, index) => ({
                                    name: lang.language,
                                    value: lang.percentage,
                                    count: lang.count,
                                    repos:
                                      overallInsights.languageRepos[
                                        lang.language
                                      ] || [],
                                    color:
                                      [
                                        "#4F46E5", // Blue
                                        "#10B981", // Green
                                        "#F59E0B", // Yellow
                                        "#EF4444", // Red
                                        "#8B5CF6", // Purple
                                        "#06B6D4", // Cyan
                                        "#84CC16", // Lime
                                        "#F97316", // Orange
                                        "#EC4899", // Pink
                                        "#6B7280", // Gray
                                      ][index] || "#6B7280",
                                  }),
                                );

                              const CustomTooltip = ({
                                active,
                                payload,
                              }: any) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg">
                                      <p className="font-semibold text-gray-900">
                                        {data.name}: {data.value}%
                                      </p>
                                      <div className="mt-2">
                                        <p className="text-sm font-medium text-gray-700 mb-1">
                                          Repositories:
                                        </p>
                                        <div className="space-y-1">
                                          {data.repos.map(
                                            (repo: string, index: number) => (
                                              <div
                                                key={index}
                                                className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                                              >
                                                {repo} (
                                                {Math.round(
                                                  data.value / data.count,
                                                )}
                                                %)
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              };

                              return (
                                <div className="h-80">
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <PieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                      >
                                        {chartData.map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip content={<CustomTooltip />} />
                                      <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value, entry: any) => (
                                          <span style={{ color: entry.color }}>
                                            {value}
                                          </span>
                                        )}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Tech Stack & Skills Chart */}
                        <div className="mt-8 space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Tech Stack & Skills
                          </h4>
                          <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            {(() => {
                              // Prepare data for the multi-layer chart
                              const categoryColors = {
                                "Web Development": "#EC4899", // Pink
                                Frontend: "#EC4899", // Pink
                                "AI/ML": "#10B981", // Green
                                "Machine Learning": "#10B981", // Green
                                "Server Development": "#F59E0B", // Yellow
                                Backend: "#F59E0B", // Yellow
                                "Data Science": "#10B981", // Green
                                Infrastructure: "#06B6D4", // Cyan
                                DevOps: "#06B6D4", // Cyan
                                Security: "#EF4444", // Red
                                Mobile: "#8B5CF6", // Purple
                                default: "#6B7280", // Gray
                              };

                              const chartData = overallInsights.techStack
                                .slice(0, 12)
                                .map((tech, index) => ({
                                  name: tech.name,
                                  value: tech.percentage,
                                  count: tech.count,
                                  repos: tech.repos,
                                  category: tech.category,
                                  color:
                                    categoryColors[tech.category] ||
                                    categoryColors["default"],
                                }));

                              const CustomTechTooltip = ({
                                active,
                                payload,
                              }: any) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-lg max-w-xs">
                                      <p className="font-semibold text-gray-900 mb-2">
                                        {data.name}
                                      </p>
                                      <p className="text-sm text-gray-600 mb-2">
                                        Category: {data.category}
                                      </p>
                                      <p className="text-sm text-gray-600 mb-2">
                                        Used in {data.count} repositories (
                                        {data.value}%)
                                      </p>
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-700 mb-1">
                                          Repositories:
                                        </p>
                                        <div className="space-y-1">
                                          {data.repos.map(
                                            (repo: string, index: number) => (
                                              <div
                                                key={index}
                                                className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                                              >
                                                {repo}
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              };

                              return (
                                <div className="h-80">
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <PieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={120}
                                        paddingAngle={1}
                                        dataKey="value"
                                      >
                                        {chartData.map((entry, index) => (
                                          <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                          />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        content={<CustomTechTooltip />}
                                      />
                                      <Legend
                                        verticalAlign="bottom"
                                        height={50}
                                        formatter={(value, entry: any) => (
                                          <span
                                            style={{ color: entry.color }}
                                            className="text-xs"
                                          >
                                            {value}
                                          </span>
                                        )}
                                        wrapperStyle={{ fontSize: "12px" }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Tech Roadmap Network */}
                        <div className="mt-8 space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Tech Roadmap
                          </h4>
                          <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            {(() => {
                              // Create nodes and edges for the tech roadmap
                              const createTechRoadmap = () => {
                                const nodes: Node[] = [];
                                const edges: Edge[] = [];

                                // Define technology relationships and positions for all popular languages
                                const techRelationships = {
                                  // JavaScript Ecosystem
                                  JavaScript: {
                                    position: { x: 200, y: 100 },
                                    connects: [
                                      "TypeScript",
                                      "React",
                                      "Node.js",
                                      "Frontend",
                                      "Vue.js",
                                      "Angular",
                                    ],
                                  },
                                  TypeScript: {
                                    position: { x: 400, y: 50 },
                                    connects: [
                                      "React",
                                      "Frontend",
                                      "Angular",
                                      "Next.js",
                                    ],
                                  },
                                  React: {
                                    position: { x: 300, y: 200 },
                                    connects: [
                                      "Frontend",
                                      "UI Development",
                                      "Next.js",
                                      "React Native",
                                    ],
                                  },
                                  "Vue.js": {
                                    position: { x: 150, y: 200 },
                                    connects: ["Frontend", "UI Development"],
                                  },
                                  Angular: {
                                    position: { x: 450, y: 200 },
                                    connects: [
                                      "Frontend",
                                      "UI Development",
                                      "TypeScript",
                                    ],
                                  },
                                  "Next.js": {
                                    position: { x: 350, y: 300 },
                                    connects: ["Frontend", "React", "SSR"],
                                  },
                                  "Node.js": {
                                    position: { x: 250, y: 350 },
                                    connects: [
                                      "Backend",
                                      "Express",
                                      "API Development",
                                    ],
                                  },
                                  Express: {
                                    position: { x: 150, y: 400 },
                                    connects: [
                                      "Backend",
                                      "API Development",
                                      "RESTful",
                                    ],
                                  },

                                  // Python Ecosystem
                                  Python: {
                                    position: { x: 600, y: 200 },
                                    connects: [
                                      "Machine Learning",
                                      "Django",
                                      "Flask",
                                      "Data Science",
                                      "Backend",
                                    ],
                                  },
                                  Django: {
                                    position: { x: 550, y: 350 },
                                    connects: [
                                      "Backend",
                                      "Web Development",
                                      "Database",
                                    ],
                                  },
                                  Flask: {
                                    position: { x: 650, y: 350 },
                                    connects: [
                                      "Backend",
                                      "API Development",
                                      "Microservices",
                                    ],
                                  },
                                  "Machine Learning": {
                                    position: { x: 800, y: 150 },
                                    connects: [
                                      "Deep Learning",
                                      "NumPy",
                                      "Pandas",
                                      "PyTorch",
                                      "TensorFlow",
                                      "Scikit-learn",
                                    ],
                                  },
                                  "Deep Learning": {
                                    position: { x: 900, y: 250 },
                                    connects: [
                                      "PyTorch",
                                      "TensorFlow",
                                      "Computer Vision",
                                      "NLP",
                                    ],
                                  },
                                  NumPy: {
                                    position: { x: 750, y: 300 },
                                    connects: [
                                      "Data Science",
                                      "Pandas",
                                      "Matplotlib",
                                    ],
                                  },
                                  Pandas: {
                                    position: { x: 850, y: 300 },
                                    connects: ["Data Science", "Data Analysis"],
                                  },
                                  PyTorch: {
                                    position: { x: 950, y: 350 },
                                    connects: ["Computer Vision", "NLP"],
                                  },
                                  TensorFlow: {
                                    position: { x: 850, y: 400 },
                                    connects: ["Computer Vision", "NLP"],
                                  },

                                  // Java Ecosystem
                                  Java: {
                                    position: { x: 100, y: 500 },
                                    connects: [
                                      "Spring",
                                      "Backend",
                                      "Enterprise",
                                      "Android",
                                      "Microservices",
                                    ],
                                  },
                                  Spring: {
                                    position: { x: 200, y: 550 },
                                    connects: [
                                      "Backend",
                                      "Enterprise",
                                      "Microservices",
                                      "API Development",
                                    ],
                                  },
                                  Android: {
                                    position: { x: 50, y: 600 },
                                    connects: ["Mobile Development", "Kotlin"],
                                  },

                                  // C# / .NET Ecosystem
                                  "C#": {
                                    position: { x: 400, y: 500 },
                                    connects: [
                                      ".NET",
                                      "ASP.NET",
                                      "Backend",
                                      "Enterprise",
                                      "Unity",
                                    ],
                                  },
                                  ".NET": {
                                    position: { x: 500, y: 550 },
                                    connects: [
                                      "ASP.NET",
                                      "Backend",
                                      "Enterprise",
                                    ],
                                  },
                                  "ASP.NET": {
                                    position: { x: 450, y: 600 },
                                    connects: ["Backend", "Web Development"],
                                  },
                                  Unity: {
                                    position: { x: 350, y: 600 },
                                    connects: [
                                      "Game Development",
                                      "3D Graphics",
                                    ],
                                  },

                                  // Go Ecosystem
                                  Go: {
                                    position: { x: 700, y: 500 },
                                    connects: [
                                      "Backend",
                                      "Microservices",
                                      "DevOps",
                                      "Cloud",
                                      "Docker",
                                    ],
                                  },
                                  Docker: {
                                    position: { x: 800, y: 550 },
                                    connects: [
                                      "DevOps",
                                      "Containerization",
                                      "Kubernetes",
                                    ],
                                  },
                                  Kubernetes: {
                                    position: { x: 850, y: 600 },
                                    connects: [
                                      "DevOps",
                                      "Cloud",
                                      "Orchestration",
                                    ],
                                  },

                                  // Rust Ecosystem
                                  Rust: {
                                    position: { x: 1000, y: 500 },
                                    connects: [
                                      "Systems Programming",
                                      "WebAssembly",
                                      "Backend",
                                      "Performance",
                                    ],
                                  },
                                  WebAssembly: {
                                    position: { x: 1100, y: 550 },
                                    connects: [
                                      "Performance",
                                      "Web Development",
                                    ],
                                  },

                                  // PHP Ecosystem
                                  PHP: {
                                    position: { x: 100, y: 100 },
                                    connects: [
                                      "Laravel",
                                      "Symfony",
                                      "Backend",
                                      "Web Development",
                                      "WordPress",
                                    ],
                                  },
                                  Laravel: {
                                    position: { x: 50, y: 150 },
                                    connects: [
                                      "Backend",
                                      "Web Development",
                                      "API Development",
                                    ],
                                  },
                                  WordPress: {
                                    position: { x: 150, y: 150 },
                                    connects: ["Web Development", "CMS"],
                                  },

                                  // Ruby Ecosystem
                                  Ruby: {
                                    position: { x: 50, y: 300 },
                                    connects: [
                                      "Ruby on Rails",
                                      "Backend",
                                      "Web Development",
                                    ],
                                  },
                                  "Ruby on Rails": {
                                    position: { x: 100, y: 350 },
                                    connects: [
                                      "Backend",
                                      "Web Development",
                                      "MVC",
                                    ],
                                  },

                                  // Swift / iOS
                                  Swift: {
                                    position: { x: 200, y: 600 },
                                    connects: [
                                      "iOS",
                                      "Mobile Development",
                                      "macOS",
                                    ],
                                  },
                                  iOS: {
                                    position: { x: 150, y: 650 },
                                    connects: [
                                      "Mobile Development",
                                      "App Store",
                                    ],
                                  },

                                  // Kotlin
                                  Kotlin: {
                                    position: { x: 300, y: 650 },
                                    connects: [
                                      "Android",
                                      "Mobile Development",
                                      "JVM",
                                    ],
                                  },

                                  // Database Technologies
                                  SQL: {
                                    position: { x: 400, y: 400 },
                                    connects: [
                                      "Database",
                                      "PostgreSQL",
                                      "MySQL",
                                      "Backend",
                                    ],
                                  },
                                  PostgreSQL: {
                                    position: { x: 350, y: 450 },
                                    connects: ["Database", "Backend"],
                                  },
                                  MySQL: {
                                    position: { x: 450, y: 450 },
                                    connects: ["Database", "Backend"],
                                  },
                                  MongoDB: {
                                    position: { x: 500, y: 400 },
                                    connects: ["Database", "NoSQL", "Backend"],
                                  },
                                  Redis: {
                                    position: { x: 550, y: 450 },
                                    connects: [
                                      "Database",
                                      "Caching",
                                      "Backend",
                                    ],
                                  },

                                  // General Categories
                                  Frontend: {
                                    position: { x: 250, y: 50 },
                                    connects: ["UI Development", "CSS", "HTML"],
                                  },
                                  Backend: {
                                    position: { x: 400, y: 300 },
                                    connects: [
                                      "API Development",
                                      "Database",
                                      "Server",
                                    ],
                                  },
                                  "Mobile Development": {
                                    position: { x: 100, y: 700 },
                                    connects: [
                                      "iOS",
                                      "Android",
                                      "React Native",
                                      "Flutter",
                                    ],
                                  },
                                  DevOps: {
                                    position: { x: 700, y: 600 },
                                    connects: [
                                      "Docker",
                                      "CI/CD",
                                      "AWS",
                                      "Cloud",
                                    ],
                                  },
                                  "Data Science": {
                                    position: { x: 700, y: 100 },
                                    connects: [
                                      "Machine Learning",
                                      "Analytics",
                                      "Visualization",
                                    ],
                                  },
                                };

                                // Filter to only include technologies from our analysis
                                const availableTechs = overallInsights.techStack
                                  .slice(0, 8)
                                  .map((t) => t.name);

                                // Create nodes for available technologies
                                availableTechs.forEach((tech, index) => {
                                  const techData =
                                    overallInsights.techStack.find(
                                      (t) => t.name === tech,
                                    );
                                  const relationship = techRelationships[
                                    tech
                                  ] || {
                                    position: {
                                      x: 100 + (index % 4) * 200,
                                      y: 100 + Math.floor(index / 4) * 150,
                                    },
                                    level:
                                      techData?.percentage > 60
                                        ? "advanced"
                                        : techData?.percentage > 30
                                          ? "mid-level"
                                          : "beginner",
                                    connects: [],
                                  };

                                  const levelColors = {
                                    beginner: "#94A3B8", // Gray
                                    "mid-level": "#3B82F6", // Blue
                                    advanced: "#10B981", // Green
                                    intermediate: "#F59E0B", // Yellow
                                  };

                                  nodes.push({
                                    id: tech,
                                    type: "default",
                                    position: relationship.position,
                                    data: {
                                      label: (
                                        <div className="px-4 py-2 bg-white border-2 rounded-lg shadow-md text-center min-w-24">
                                          <div className="font-semibold text-gray-900 text-sm">
                                            {tech}
                                          </div>
                                          <div
                                            className="text-xs mt-1 px-2 py-1 rounded-full text-white"
                                            style={{
                                              backgroundColor:
                                                levelColors[relationship.level],
                                            }}
                                          >
                                            {relationship.level}
                                          </div>
                                          <div className="text-xs text-gray-600 mt-1">
                                            {techData?.percentage}%
                                          </div>
                                        </div>
                                      ),
                                    },
                                    style: {
                                      background: "transparent",
                                      border: "none",
                                      width: "auto",
                                      height: "auto",
                                    },
                                  });
                                });

                                // Create edges between related technologies
                                availableTechs.forEach((tech) => {
                                  const relationship = techRelationships[tech];
                                  if (relationship?.connects) {
                                    relationship.connects.forEach(
                                      (connectedTech) => {
                                        if (
                                          availableTechs.includes(connectedTech)
                                        ) {
                                          edges.push({
                                            id: `${tech}-${connectedTech}`,
                                            source: tech,
                                            target: connectedTech,
                                            type: "smoothstep",
                                            style: {
                                              stroke: "#CBD5E1",
                                              strokeWidth: 2,
                                            },
                                            animated: false,
                                          });
                                        }
                                      },
                                    );
                                  }
                                });

                                return { nodes, edges };
                              };

                              const { nodes, edges } = createTechRoadmap();

                              return (
                                <div className="h-96 w-full border border-gray-200 rounded-lg">
                                  <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    fitView
                                    attributionPosition="bottom-left"
                                    nodesDraggable={true}
                                    nodesConnectable={false}
                                    elementsSelectable={true}
                                  >
                                    <Background color="#F1F5F9" gap={20} />
                                    <Controls />
                                  </ReactFlow>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                      Repository Analysis Summary
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(allAnalyses).map(
                        ([repoName, analysis]) => (
                          <div
                            key={repoName}
                            className="bg-gray-50 border border-gray-200 rounded-2xl p-6"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-900 truncate">
                                {repoName.split("/")[1]}
                              </h4>
                              <div
                                className={`text-2xl font-bold ${getScoreColor(analysis.data.overall_score)}`}
                              >
                                {formatScore(analysis.data.overall_score)}
                              </div>
                            </div>

                            <div className="space-y-3 mb-6">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Language:</span>
                                <span className="font-medium text-gray-900">
                                  {analysis.data.repository.language || "Mixed"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Lines of Code:
                                </span>
                                <span className="font-medium text-gray-900">
                                  {analysis.data.metrics.lines_of_code.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Files Analyzed:
                                </span>
                                <span className="font-medium text-gray-900">
                                  {analysis.data.metrics.files_analyzed}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Security Score:
                                </span>
                                <span
                                  className={`font-medium ${getScoreColor(analysis.data.security.security_score)}`}
                                >
                                  {formatScore(
                                    analysis.data.security.security_score,
                                  )}
                                </span>
                              </div>
                            </div>

                            <Button
                              onClick={() => {
                                setAnalysis(analysis);
                                setSelectedRepo(
                                  repositories.find(
                                    (repo) => repo.full_name === repoName,
                                  ) || null,
                                );
                              }}
                              className="w-full px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 text-sm font-medium"
                            >
                              View Details
                            </Button>
                          </div>
                        ),
                      )}
                    </div>

                    {/* Overall Statistics */}
                    <div className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-200">
                      <h4 className="text-xl font-semibold text-gray-900 mb-6">
                        Overall Statistics
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {Object.keys(allAnalyses).length}
                          </div>
                          <div className="text-gray-600">
                            Repositories Analyzed
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {Math.round(
                              Object.values(allAnalyses).reduce(
                                (sum, analysis) =>
                                  sum + analysis.data.overall_score,
                                0,
                              ) / Object.keys(allAnalyses).length,
                            )}
                          </div>
                          <div className="text-gray-600">Average Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {Object.values(allAnalyses)
                              .reduce(
                                (sum, analysis) =>
                                  sum + analysis.data.metrics.lines_of_code,
                                0,
                              )
                              .toLocaleString()}
                          </div>
                          <div className="text-gray-600">
                            Total Lines of Code
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900 mb-2">
                            {Object.values(allAnalyses).reduce(
                              (sum, analysis) =>
                                sum + analysis.data.metrics.files_analyzed,
                              0,
                            )}
                          </div>
                          <div className="text-gray-600">
                            Total Files Analyzed
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                  <div className="text-8xl mb-6">🔍</div>
                  <h3 className="text-3xl font-semibold text-gray-900 mb-4">
                    Ready to Analyze
                  </h3>
                  <p className="text-xl text-gray-600">
                    Select a repository from above to start your analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
