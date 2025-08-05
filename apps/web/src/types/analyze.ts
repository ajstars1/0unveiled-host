export interface Repository {
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

export interface ProjectOverview {
  raw_ai_analysis: string;
  detailed_insights: string;
  gemini_recommendations: string;
}

export interface AnalysisResult {
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
    project_overview?: ProjectOverview;
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

export type TechRelationship = {
  position: { x: number; y: number };
  connects: string[];
  level: "beginner" | "mid-level" | "advanced" | "intermediate";
};

export interface OverallInsights {
  overallScore: number;
  repoCount: number;
  topLanguages: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  languageRepos: Record<string, string[]>;
  techStack: Array<{
    name: string;
    count: number;
    repos: string[];
    category: string;
    percentage: number;
  }>;
  projectTypes: string[];
  insights: string[];
  totalLinesOfCode: number;
  avgSecurity: number;
}

export interface AnalysisState {
  repositories: Repository[];
  selectedRepo: Repository | null;
  loading: boolean;
  analyzing: boolean;
  scanningAll: boolean;
  analysis: AnalysisResult | null;
  allAnalyses: { [key: string]: AnalysisResult };
  error: string;
  userId: string;
  currentScanRepo: string;
  selectedRepos: Set<number>;
}
