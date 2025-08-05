import { AnalysisResult, OverallInsights } from '@/types/analyze';

export const generateOverallInsights = (analyses: {
  [key: string]: AnalysisResult;
}): OverallInsights | null => {
  const repoCount = Object.keys(analyses).length;
  if (repoCount < 2) return null; // Only show for 2+ repositories

  // Collect all data
  const languages = new Map<string, number>();
  const languageRepos = new Map<string, string[]>(); // Track which repos use each language
  const techStack = new Map<
    string,
    { count: number; repos: string[]; category: string }
  >();
  const totalScores: number[] = [];
  const totalLinesOfCode: number[] = [];
  const totalSecurity: number[] = [];
  const allStrengths: string[] = [];
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
