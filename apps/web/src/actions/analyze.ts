'use server';

interface RepositoryActionResult {
  success: boolean;
  data?: any[];
  error?: string;
}

'use server';

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBySupabaseId, getUserByUserId } from "@/data/user";
import { fetchUserGithubRepos } from "@/actions/github";
import { db } from "@0unveiled/database";
import { accounts } from "@0unveiled/database";
import { eq, and } from "drizzle-orm";

interface RepositoryActionResult {
  success: boolean;
  data?: any[];
  error?: string;
}

export async function getRepositoriesAction(userId: string): Promise<RepositoryActionResult> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Validate current user authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'Authentication required' };
    }

    const currentDbUser = await getUserBySupabaseId(authUser.id);
    if (!currentDbUser) {
      return { success: false, error: 'Current user profile not found' };
    }

    // Get the target user
    const targetUser = await getUserByUserId(userId);
    if (!targetUser) {
      return { success: false, error: 'Target user not found' };
    }

    // Check if target user has GitHub connected
    const githubAccount = await db.select().from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'github')))
      .limit(1);

    if (!githubAccount || githubAccount.length === 0) {
      return { 
        success: false, 
        error: `User ${targetUser.firstName} ${targetUser.lastName} has not connected their GitHub account` 
      };
    }

    const githubAccountData = githubAccount[0];

    if (!githubAccountData?.installationId) {
      return { 
        success: false, 
        error: `User ${targetUser.firstName} ${targetUser.lastName} has not completed GitHub App installation` 
      };
    }

    const installationId = parseInt(githubAccountData.installationId, 10);
    if (isNaN(installationId)) {
      return { 
        success: false, 
        error: 'Invalid GitHub App installation data for target user' 
      };
    }

    // Use the same GitHub App authentication logic as in fetchUserGithubRepos
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\n/g, '\n');

    if (!appId || !privateKey) {
      return { success: false, error: "Server configuration error: GitHub App credentials missing." };
    }

    // Authenticate as GitHub App Installation for the target user
    const { App } = await import("octokit");
    const app = new App({
      appId: appId,
      privateKey: privateKey,
    });

    const octokit = await app.getInstallationOctokit(installationId);

    // Fetch repositories using Installation Token
    const githubApiResponse = await octokit.request('GET /installation/repositories', {
      per_page: 100,
      headers: { 'X-GitHub-Api-Version': '2022-11-28' },
    });

    const userRepos = githubApiResponse.data.repositories;

    // Format repositories to match the expected interface
    const formattedRepos = userRepos.map((repo) => ({
      id: repo.id.toString(),
      name: repo.name,
      description: repo.description || '',
      html_url: repo.html_url,
      updated_at: repo.updated_at || new Date().toISOString(),
      stargazers_count: repo.stargazers_count || 0,
      forks_count: repo.forks_count || 0,
      language: repo.language,
      topics: repo.topics || [],
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
      },
      isImported: false, // We can check this later if needed
      private: repo.private,
    }));

    return { 
      success: true, 
      data: formattedRepos 
    };

  } catch (error: any) {
    console.error('Error fetching repositories:', error);
    
    // Provide more specific error messages based on GitHub API errors
    if (error.status === 401) {
      return { success: false, error: "GitHub App authentication failed. Please try reconnecting GitHub." };
    } else if (error.status === 404) {
      return { success: false, error: "GitHub App installation not found. Please reinstall the GitHub App." };
    } else if (error.status === 403) {
      return { success: false, error: "GitHub App does not have permission to access repositories. Please check installation settings." };
    }
    
    return { 
      success: false, 
      error: `Failed to fetch repositories: ${error.message || 'Unknown error'}` 
    };
  }
}

export async function analyzeRepositoryAction(
  userId: string, 
  owner: string, 
  repoName: string,
  maxFiles: number = 50
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate current user authentication
    const supabase = await createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'Authentication required' };
    }

    const currentDbUser = await getUserBySupabaseId(authUser.id);
    if (!currentDbUser) {
      return { success: false, error: 'Current user profile not found' };
    }

    // Get the target user
    const targetUser = await getUserByUserId(userId);
    if (!targetUser) {
      return { success: false, error: 'Target user not found' };
    }

    // Check if target user has GitHub connected
    const githubAccount = await db.select().from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.provider, 'github')))
      .limit(1);

    if (!githubAccount || githubAccount.length === 0) {
      return { 
        success: false, 
        error: `User ${targetUser.firstName} ${targetUser.lastName} has not connected their GitHub account` 
      };
    }

    // Use the existing getRepoCodeContents function to fetch real repository data
    const repoFullName = `${owner}/${repoName}`;
    const { getRepoCodeContents } = await import("@/actions/github");
    const codeResult = await getRepoCodeContents(repoFullName, userId);

    let analysisData;

    if ('error' in codeResult) {
      // If we can't fetch the code, return a basic analysis with error info
      analysisData = {
        repository: {
          name: repoName,
          owner: owner,
          full_name: repoFullName,
          description: `Analysis attempted for ${repoFullName}`,
          language: "Unknown",
          stargazers_count: 0,
          forks_count: 0,
          size: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pushed_at: new Date().toISOString(),
          topics: [],
          license: null,
          default_branch: "main"
        },
        analysis: {
          tech_stack: {
            languages: {},
            frameworks: [],
            tools: [],
            databases: [],
            deployment: []
          },
          ai_insights: {
            summary: `Unable to analyze ${repoFullName}: ${codeResult.error}`,
            complexity_score: 0,
            maintainability: "Unknown",
            recommended_improvements: [
              "Repository code could not be accessed for analysis"
            ],
            architecture_patterns: []
          },
          security: {
            security_score: 0,
            vulnerabilities: [],
            recommendations: [
              "Security analysis requires code access"
            ]
          },
          code_quality: {
            quality_score: 0,
            metrics: {
              lines_of_code: 0,
              cyclomatic_complexity: 0,
              test_coverage: 0,
              technical_debt_ratio: 0
            },
            issues: [`Code access error: ${codeResult.error}`]
          }
        },
        metadata: {
          analysis_timestamp: new Date().toISOString(),
          analysis_version: "1.0.0",
          files_analyzed: 0,
          max_files: maxFiles,
          status: "failed",
          error: codeResult.error
        }
      };
    } else {
      // We have the code, perform basic analysis
      const codeContent = codeResult.code;
      const lines = codeContent.split('\n').length;
      
      // Basic language detection from file extensions and content
      const languageDetection = analyzeLanguages(codeContent);
      const frameworkDetection = analyzeFrameworks(codeContent);
      
      analysisData = {
        repository: {
          name: repoName,
          owner: owner,
          full_name: repoFullName,
          description: `Repository analysis completed for ${repoFullName}`,
          language: languageDetection.primary || "JavaScript",
          stargazers_count: 0,
          forks_count: 0,
          size: codeContent.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pushed_at: new Date().toISOString(),
          topics: frameworkDetection.topics,
          license: null,
          default_branch: "main"
        },
        analysis: {
          tech_stack: {
            languages: languageDetection.breakdown,
            frameworks: frameworkDetection.frameworks,
            tools: frameworkDetection.tools,
            databases: frameworkDetection.databases,
            deployment: frameworkDetection.deployment
          },
          ai_insights: {
            summary: `Analysis of ${repoFullName}: This repository contains ${lines} lines of code across multiple files. Primary language detected: ${languageDetection.primary}. ${frameworkDetection.summary}`,
            complexity_score: Math.min(10, Math.max(1, lines / 1000)), // Simple complexity based on size
            maintainability: lines < 5000 ? "Good" : lines < 15000 ? "Moderate" : "Complex",
            recommended_improvements: generateRecommendations(languageDetection, frameworkDetection, lines),
            architecture_patterns: frameworkDetection.patterns
          },
          security: {
            security_score: 7.0, // Default score, would need real security analysis
            vulnerabilities: [],
            recommendations: [
              "Perform dependency vulnerability scan",
              "Implement proper input validation",
              "Use environment variables for sensitive data",
              "Enable automated security scanning"
            ]
          },
          code_quality: {
            quality_score: Math.min(10, Math.max(1, 10 - (lines / 2000))), // Simple quality metric
            metrics: {
              lines_of_code: lines,
              cyclomatic_complexity: Math.floor(lines / 100), // Rough estimate
              test_coverage: 0, // Would need real analysis
              technical_debt_ratio: 10 // Default estimate
            },
            issues: analyzeCodeIssues(codeContent)
          }
        },
        metadata: {
          analysis_timestamp: new Date().toISOString(),
          analysis_version: "1.0.0",
          files_analyzed: (codeContent.match(/--- FILE:/g) || []).length,
          max_files: maxFiles,
          status: "completed"
        }
      };
    }

    return {
      success: true,
      data: analysisData
    };

  } catch (error: any) {
    console.error(`Error analyzing repository ${owner}/${repoName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    };
  }
}

// Helper functions for basic code analysis
function analyzeLanguages(code: string) {
  const languages: Record<string, number> = {};
  let totalLines = 0;

  // Count lines by file type based on file markers
  const fileMatches = code.match(/--- FILE: ([^---]+) ---/g) || [];
  
  fileMatches.forEach(match => {
    const fileName = match.replace(/--- FILE: (.+) ---/, '$1');
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext) {
      const langMap: Record<string, string> = {
        'js': 'JavaScript',
        'jsx': 'JavaScript',
        'ts': 'TypeScript', 
        'tsx': 'TypeScript',
        'py': 'Python',
        'java': 'Java',
        'go': 'Go',
        'rb': 'Ruby',
        'php': 'PHP',
        'css': 'CSS',
        'scss': 'SCSS',
        'html': 'HTML',
        'md': 'Markdown',
        'json': 'JSON',
        'yml': 'YAML',
        'yaml': 'YAML'
      };
      
      const language = langMap[ext] || ext.toUpperCase();
      languages[language] = (languages[language] || 0) + 1;
      totalLines++;
    }
  });

  // Convert counts to percentages
  const breakdown: Record<string, number> = {};
  Object.entries(languages).forEach(([lang, count]) => {
    breakdown[lang] = Math.round((count / totalLines) * 100);
  });

  const primary = Object.entries(breakdown).sort(([,a], [,b]) => b - a)[0]?.[0];

  return { breakdown, primary };
}

function analyzeFrameworks(code: string) {
  const frameworks: string[] = [];
  const tools: string[] = [];
  const databases: string[] = [];
  const deployment: string[] = [];
  const patterns: string[] = [];
  const topics: string[] = [];

  // Framework detection
  if (code.includes('react') || code.includes('React')) {
    frameworks.push('React');
    topics.push('react');
  }
  if (code.includes('next') || code.includes('Next')) {
    frameworks.push('Next.js');
    topics.push('nextjs');
  }
  if (code.includes('vue') || code.includes('Vue')) {
    frameworks.push('Vue.js');
    topics.push('vuejs');
  }
  if (code.includes('angular') || code.includes('Angular')) {
    frameworks.push('Angular');
    topics.push('angular');
  }
  if (code.includes('express') || code.includes('Express')) {
    frameworks.push('Express.js');
    topics.push('express');
  }

  // Tool detection
  if (code.includes('eslint') || code.includes('ESLint')) tools.push('ESLint');
  if (code.includes('prettier') || code.includes('Prettier')) tools.push('Prettier');
  if (code.includes('webpack') || code.includes('Webpack')) tools.push('Webpack');
  if (code.includes('vite') || code.includes('Vite')) tools.push('Vite');

  // Database detection
  if (code.includes('mongodb') || code.includes('MongoDB')) databases.push('MongoDB');
  if (code.includes('postgresql') || code.includes('postgres')) databases.push('PostgreSQL');
  if (code.includes('mysql') || code.includes('MySQL')) databases.push('MySQL');
  if (code.includes('supabase') || code.includes('Supabase')) databases.push('Supabase');

  // Deployment detection
  if (code.includes('docker') || code.includes('Docker')) deployment.push('Docker');
  if (code.includes('vercel') || code.includes('Vercel')) deployment.push('Vercel');
  if (code.includes('netlify') || code.includes('Netlify')) deployment.push('Netlify');

  // Pattern detection
  if (frameworks.includes('React') || frameworks.includes('Vue.js')) {
    patterns.push('Component-based architecture');
  }
  if (frameworks.includes('Next.js')) {
    patterns.push('Server-side rendering');
  }

  const summary = `Detected frameworks: ${frameworks.join(', ') || 'None'}. Tools: ${tools.join(', ') || 'None'}.`;

  return { frameworks, tools, databases, deployment, patterns, topics, summary };
}

function generateRecommendations(languages: any, frameworks: any, lines: number): string[] {
  const recommendations: string[] = [];

  if (lines > 10000) {
    recommendations.push("Consider breaking down large files into smaller, more manageable modules");
  }
  
  if (frameworks.frameworks.includes('React')) {
    recommendations.push("Consider implementing React testing with Jest and React Testing Library");
  }
  
  if (!frameworks.tools.includes('ESLint')) {
    recommendations.push("Add ESLint for code quality and consistency");
  }
  
  if (!frameworks.tools.includes('Prettier')) {
    recommendations.push("Add Prettier for code formatting");
  }
  
  recommendations.push("Implement comprehensive unit tests");
  recommendations.push("Add automated CI/CD pipeline");
  recommendations.push("Document API endpoints and component interfaces");

  return recommendations;
}

function analyzeCodeIssues(code: string): string[] {
  const issues: string[] = [];

  // Basic issue detection
  if (code.includes('console.log')) {
    issues.push("Debug console.log statements found - consider removing for production");
  }
  
  if (code.includes('TODO') || code.includes('FIXME')) {
    issues.push("TODO/FIXME comments found - consider addressing these items");
  }
  
  if (!code.includes('test') && !code.includes('spec')) {
    issues.push("No test files detected - consider adding unit tests");
  }

  return issues;
}
