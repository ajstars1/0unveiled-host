/**
 * Helper functions for extracting data from analysis results
 */

/**
 * Extracts technology stack from analysis data
 */
export const extractTechStack = (analysisData: any): string[] => {
  if (!analysisData) return [];

  const techItems = new Set<string>();

  // Extract from technology_stack if available
  const techStack = analysisData.technology_stack;
  if (techStack) {
    // Add languages
    if (Array.isArray(techStack.languages)) {
      techStack.languages.forEach((lang: any) => {
        const name = typeof lang === 'string' ? lang : lang?.name;
        if (name) techItems.add(name);
      });
    }

    // Add frameworks
    if (Array.isArray(techStack.frameworks)) {
      techStack.frameworks.forEach((fw: any) => {
        const name = typeof fw === 'string' ? fw : fw?.name;
        if (name) techItems.add(name);
      });
    }

    // Add libraries
    if (Array.isArray(techStack.libraries)) {
      techStack.libraries.forEach((lib: any) => {
        const name = typeof lib === 'string' ? lib : lib?.name;
        if (name) techItems.add(name);
      });
    }

    // Add tools
    if (Array.isArray(techStack.tools)) {
      techStack.tools.forEach((tool: any) => {
        const name = typeof tool === 'string' ? tool : tool?.name;
        if (name) techItems.add(name);
      });
    }

    // Add databases
    if (Array.isArray(techStack.databases)) {
      techStack.databases.forEach((db: any) => {
        const name = typeof db === 'string' ? db : db?.name;
        if (name) techItems.add(name);
      });
    }
  }

  // Primary language as fallback
  const primaryLanguage = analysisData.repository?.language ||
    (analysisData.repository_info?.language as string) ||
    (analysisData.technology_stack as any)?.primary_language;

  if (primaryLanguage && !techItems.has(primaryLanguage)) {
    techItems.add(primaryLanguage);
  }

  return Array.from(techItems);
};

/**
 * Extracts or generates an AI summary from analysis data
 */
export const extractAISummary = (analysisData: any): string => {
  if (!analysisData) return '';

  // Use AI insights if available
  if (analysisData.ai_insights) {
    // If we have a code assessment, use that
    if (analysisData.ai_insights.code_assessment) {
      return analysisData.ai_insights.code_assessment;
    }

    // Combine strengths and project maturity if available
    const strengths = Array.isArray(analysisData.ai_insights.strengths)
      ? analysisData.ai_insights.strengths.join('. ')
      : '';

    const maturity = analysisData.ai_insights.project_maturity || '';

    if (strengths || maturity) {
      return [strengths, maturity].filter(Boolean).join('. ');
    }
  }

  // Generate a basic summary from repository info if no AI insights
  const repoName = analysisData.repository?.full_name ||
    (analysisData.repository_info?.owner && analysisData.repository_info?.name
      ? `${analysisData.repository_info.owner}/${analysisData.repository_info.name}`
      : '');

  const language = analysisData.repository?.language ||
    analysisData.repository_info?.language || '';

  const description = analysisData.repository?.description ||
    analysisData.repository_info?.description || '';

  if (repoName || language || description) {
    const parts = [];
    if (repoName) parts.push(`Repository: ${repoName}`);
    if (language) parts.push(`Primary language: ${language}`);
    if (description) parts.push(description);
    return parts.join('. ');
  }

  return 'GitHub repository analysis';
};
