import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/data/user";
import { analyzeRepositoryAction } from "@/actions/analyze";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, showcasedItems, aiVerifiedSkills } from "@0unveiled/database";
import { eq, and } from "drizzle-orm";

interface ProfileAnalysisRequest {
  username: string;
}

interface RepositoryData {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  html_url: string;
}

interface ProfileAnalysisData {
  userId: string;
  username: string;
  repositories: RepositoryData[];
  profileData: {
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    headline: string | null;
    location: string | null;
    college: string | null;
    education: Array<{
      institution: string;
      degree: string | null;
      fieldOfStudy: string | null;
      startDate: string;
      endDate: string | null;
      current: boolean;
      description: string | null;
    }>;
    experience: Array<{
      companyName: string;
      jobTitle: string;
      location: string | null;
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
}

// Stream data to client
function createEventStreamResponse(encoder: TextEncoder, controller: ReadableStreamDefaultController) {
  return {
    sendEvent: (data: any) => {
      try {
        const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
        controller.enqueue(chunk);
      } catch (error: any) {
        if (error?.code === 'ERR_INVALID_STATE') {
          console.log('Controller already closed, skipping event:', data);
          return;
        }
        // Re-throw other errors
        throw error;
      }
    }
  };
}

// Function to save AI-verified skills to database
async function saveAIVerifiedSkills(
  userId: string, 
  comprehensiveTechStack: any, 
  detailedAnalyses: Array<{repository: RepositoryData; analysis: any}>
) {
  try {
    // Clear existing AI-verified skills for this user
    await db.delete(aiVerifiedSkills).where(eq(aiVerifiedSkills.userId, userId));
    
    const skillsToInsert: Array<{
      userId: string;
      skillName: string;
      skillType: string;
      confidenceScore: number;
      repositoryCount: number;
      linesOfCodeCount: number;
      sourceAnalysis: any;
      isVisible: boolean;
    }> = [];
    
    // Process all categories of tech stack
    Object.entries(comprehensiveTechStack).forEach(([categoryKey, skills]) => {
      const skillsArray = skills as any[];
      skillsArray.forEach((skill: any) => {
        skillsToInsert.push({
          userId,
          skillName: skill.name,
          skillType: skill.type,
          confidenceScore: skill.confidence,
          repositoryCount: skill.count,
          linesOfCodeCount: Math.round(skill.linesOfCode),
          sourceAnalysis: {
            category: categoryKey,
            detectedIn: detailedAnalyses.length,
            totalRepositories: detailedAnalyses.length,
            analysisDate: new Date().toISOString(),
            verificationMethod: 'code_analysis'
          },
          isVisible: true
        });
      });
    });
    
    // Insert new AI-verified skills in batches
    if (skillsToInsert.length > 0) {
      // Batch insert to handle large numbers of skills
      const batchSize = 50;
      for (let i = 0; i < skillsToInsert.length; i += batchSize) {
        const batch = skillsToInsert.slice(i, i + batchSize);
        await db.insert(aiVerifiedSkills).values(batch);
      }
      
      console.log(`Saved ${skillsToInsert.length} AI-verified skills for user ${userId}`);
      return { success: true, count: skillsToInsert.length };
    }
    
    return { success: true, count: 0 };
  } catch (error) {
    console.error('Error saving AI-verified skills:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to get GitHub repositories from user's portfolio
async function getPortfolioGithubRepos(userId: string): Promise<{
  success: boolean;
  repositories?: RepositoryData[];
  error?: string;
}> {
  try {
    // Get GitHub repositories from the user's portfolio
    const portfolioItems = await db.query.showcasedItems.findMany({
      where: and(
        eq(showcasedItems.userId, userId),
        eq(showcasedItems.provider, 'GITHUB')
      ),
    });

    if (portfolioItems.length === 0) {
      return { success: false, error: "No GitHub repositories found in portfolio" };
    }

    const repositories: RepositoryData[] = portfolioItems.map((item: any) => {
      const urlParts = item.url.split('/');
      const owner = urlParts[urlParts.length - 2];
      const repoName = urlParts[urlParts.length - 1];

      return {
        name: repoName,
        full_name: `${owner}/${repoName}`,
        description: item.description,
        language: null, // We'll get this from the analysis
        stargazers_count: 0, // We'll get this from the analysis
        forks_count: 0, // We'll get this from the analysis
        size: 0, // We'll get this from the analysis
        html_url: item.url,
      };
    });

    return { success: true, repositories };
  } catch (error) {
    console.error("Error fetching portfolio GitHub repos:", error);
    return { success: false, error: "Failed to fetch portfolio repositories" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username } = (await request.json()) as ProfileAnalysisRequest;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required" },
        { status: 400 }
      );
    }

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const { sendEvent } = createEventStreamResponse(encoder, controller);

        try {
          // Step 1: Get user data
          sendEvent({ step: "Fetching user profile data...", progress: 10 });
          
          const user = await getUserByUsername(username);
          if (!user) {
            sendEvent({ error: "User not found" });
            controller.close();
            return;
          }

          // Step 2: Get GitHub repositories from user's portfolio
          sendEvent({ step: "Fetching portfolio GitHub repositories...", progress: 25 });
          
          let repositories: RepositoryData[] = [];
          let githubConnected = false;
          
          try {
            const reposResult = await getPortfolioGithubRepos(user.id);
            console.log("Portfolio repos result:", reposResult);
            
            if (reposResult.success && reposResult.repositories) {
              repositories = reposResult.repositories;
              githubConnected = true;
              console.log("Found portfolio repositories:", repositories.length);
            } else {
              // No GitHub repositories in portfolio - continue with profile-only analysis
              console.log("No GitHub repositories in portfolio, continuing with profile-only analysis");
              githubConnected = false;
            }

          } catch (repoError) {
            console.error("Portfolio repos fetch error:", repoError);
            // Don't fail the entire analysis, just continue without GitHub repos
            githubConnected = false;
          }

          // Step 3: Prepare profile data
          if (githubConnected) {
            sendEvent({ step: "Organizing profile and portfolio repository information...", progress: 40 });
          } else {
            sendEvent({ step: "Analyzing profile information (no GitHub repositories in portfolio)...", progress: 40 });
          }
            const profileData: ProfileAnalysisData = {
              userId: user.id,
              username: user.username || username,
              repositories: repositories.slice(0, 10), // Limit to most recent 10 repos
              profileData: {
                firstName: user.firstName,
                lastName: user.lastName,
                bio: user.bio,
                headline: user.headline,
                location: user.location,
                college: user.college,
                education: (user.education || []).map(edu => ({
                  institution: edu.institution,
                  degree: edu.degree,
                  fieldOfStudy: edu.fieldOfStudy,
                  startDate: edu.startDate.toISOString(),
                  endDate: edu.endDate?.toISOString() || null,
                  current: edu.current,
                  description: edu.description,
                })),
                experience: (user.experience || []).map(exp => ({
                  companyName: exp.companyName,
                  jobTitle: exp.jobTitle,
                  location: exp.location,
                  startDate: exp.startDate.toISOString(),
                  endDate: exp.endDate?.toISOString() || null,
                  current: exp.current,
                  description: exp.description,
                })),
                skills: (user.skills || []).map(userSkill => ({
                  id: userSkill.skill.id,
                  name: userSkill.skill.name,
                })),
              },
            };

            // Step 4: Analyze portfolio repositories (real analysis)
            let detailedAnalyses: Array<{
              repository: RepositoryData;
              analysis: any;
            }> = [];

            if (githubConnected && repositories.length > 0) {
              sendEvent({ step: "Analyzing portfolio repository content and patterns...", progress: 50 });
              
              // Analyze all portfolio repositories
              const totalRepos = repositories.length;
              
              for (let i = 0; i < totalRepos; i++) {
                const repo = repositories[i];
                const progressPercent = 50 + (i / totalRepos) * 25; // 50% to 75%
                
                sendEvent({ 
                  step: `Analyzing portfolio repository ${i + 1}/${totalRepos}: ${repo.name}...`, 
                  progress: Math.round(progressPercent) 
                });
                
                try {
                  // Extract owner and repo name from full_name
                  const [owner, repoName] = repo.full_name.split('/');
                  
                  // Analyze this repository using the same service as individual analysis
                  const analysisResult = await analyzeRepositoryAction(
                    user.id,
                    owner,
                    repoName,
                    50, // More files per repo since we're analyzing fewer, selected repos
                    (status: string, progress: number) => {
                      // Send sub-progress updates
                      sendEvent({ 
                        step: `${repo.name}: ${status}`, 
                        progress: Math.round(progressPercent + (progress / 100) * (25 / totalRepos))
                      });
                    }
                  );
                  
                  if (analysisResult.success && analysisResult.data) {
                    detailedAnalyses.push({
                      repository: repo,
                      analysis: analysisResult.data
                    });
                  } else {
                    console.log(`Failed to analyze portfolio repository ${repo.name}:`, analysisResult.error);
                    // Continue with other repositories even if one fails
                  }
                } catch (repoAnalysisError) {
                  console.error(`Error analyzing portfolio repository ${repo.name}:`, repoAnalysisError);
                  // Continue with other repositories even if one fails
                }
              }
              
              sendEvent({ step: "Aggregating portfolio analysis results...", progress: 75 });
            } else {
              sendEvent({ step: "Analyzing profile content and career data...", progress: 60 });
            }
            
            // Step 5: Generate comprehensive insights and save AI-verified skills
            sendEvent({ step: "Generating comprehensive career insights and AI-verified skills...", progress: 80 });
            
            // Create analysis result
            const analysisResult = await generateProfileAnalysis(profileData, githubConnected, detailedAnalyses);
            
            // Save AI-verified skills to database if we have comprehensive tech stack data
            let aiVerificationStatus: {
              skillsVerified: number;
              verifiedAt: string;
              status: 'completed' | 'failed' | 'error' | 'skipped';
              reason?: string;
              error?: string;
            } = {
              skillsVerified: 0,
              verifiedAt: new Date().toISOString(),
              status: 'skipped',
              reason: githubConnected ? 'No repository analysis available' : 'GitHub not connected'
            };
            
            if (githubConnected && detailedAnalyses.length > 0 && (analysisResult as any).techStackAnalysis.comprehensive) {
              sendEvent({ step: "Saving AI-verified skills to profile...", progress: 90 });
              
              try {
                const saveResult = await saveAIVerifiedSkills(
                  user.id,
                  (analysisResult as any).techStackAnalysis.comprehensive,
                  detailedAnalyses
                );
                
                if (saveResult.success) {
                  console.log(`Successfully saved ${saveResult.count} AI-verified skills for user ${user.id}`);
                  aiVerificationStatus = {
                    skillsVerified: saveResult.count || 0,
                    verifiedAt: new Date().toISOString(),
                    status: 'completed'
                  };
                } else {
                  console.error('Failed to save AI-verified skills:', saveResult.error);
                  aiVerificationStatus = {
                    skillsVerified: 0,
                    verifiedAt: new Date().toISOString(),
                    status: 'failed',
                    error: saveResult.error
                  };
                }
              } catch (skillSaveError) {
                console.error('Error during AI-verified skills saving:', skillSaveError);
                aiVerificationStatus = {
                  skillsVerified: 0,
                  verifiedAt: new Date().toISOString(),
                  status: 'error',
                  error: skillSaveError instanceof Error ? skillSaveError.message : 'Unknown error'
                };
              }
            }

            // Add verification status to result
            const finalResult = {
              ...analysisResult,
              aiVerificationStatus
            };

            // Step 6: Complete
            sendEvent({ 
              step: "Analysis complete!", 
              progress: 100,
              result: finalResult 
            });

            // Give the client a moment to process the final result before closing
            await new Promise(resolve => setTimeout(resolve, 100));

          controller.close();
        } catch (error) {
          console.error("Profile analysis error:", error);
          try {
            sendEvent({ 
              error: error instanceof Error ? error.message : "Analysis failed" 
            });
          } catch (sendError) {
            console.log("Failed to send error event, controller likely closed:", sendError);
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Profile analysis API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateProfileAnalysis(data: ProfileAnalysisData, githubConnected: boolean = true, detailedAnalyses: Array<{repository: RepositoryData; analysis: any}> = []) {
  // Calculate repository statistics with enhanced metrics from actual analysis
  const repoStats = {
    totalRepos: data.repositories.length,
    totalStars: data.repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: data.repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
    languages: getLanguageDistribution(data.repositories),
    averageRepoSize: data.repositories.length > 0 
      ? Math.round(data.repositories.reduce((sum, repo) => sum + repo.size, 0) / data.repositories.length)
      : 0,
    // Enhanced metrics from actual code analysis
    totalLinesOfCode: detailedAnalyses.reduce((sum, analysis) => {
      return sum + (analysis.analysis?.data?.metrics?.total_lines || 0);
    }, 0),
    averageComplexity: detailedAnalyses.length > 0 
      ? Math.round(detailedAnalyses.reduce((sum, analysis) => {
          return sum + (analysis.analysis?.data?.metrics?.complexity || 0);
        }, 0) / detailedAnalyses.length)
      : 0,
    averageQuality: detailedAnalyses.length > 0 
      ? Math.round(detailedAnalyses.reduce((sum, analysis) => {
          return sum + (analysis.analysis?.data?.quality?.overall_score || 0);
        }, 0) / detailedAnalyses.length)
      : 0,
  };

  // Extract comprehensive tech stack from detailed analyses
  const comprehensiveTechStack = githubConnected && detailedAnalyses.length > 0 
    ? getComprehensiveTechStack(detailedAnalyses)
    : {
        languages: [],
        frameworks: [],
        libraries: [],
        tools: [],
        databases: [],
        cloud: []
      };

  // Calculate career statistics
  const careerStats = {
    totalYearsExperience: calculateTotalExperience(data.profileData.experience),
    totalEducationYears: calculateTotalEducation(data.profileData.education),
    skillsCount: data.profileData.skills.length,
    currentRole: data.profileData.experience.find(exp => exp.current),
    currentEducation: data.profileData.education.find(edu => edu.current),
  };

  // Generate insights
  const insights = generateCareerInsights(data, repoStats, careerStats, githubConnected, detailedAnalyses, comprehensiveTechStack);

  return {
    profileSummary: {
      name: `${data.profileData.firstName || ''} ${data.profileData.lastName || ''}`.trim(),
      username: data.username,
      headline: data.profileData.headline,
      bio: data.profileData.bio,
      location: data.profileData.location,
      college: data.profileData.college,
    },
    repositoryAnalysis: {
      stats: repoStats,
      topRepositories: data.repositories
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 5)
        .map(repo => ({
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          url: repo.html_url,
        })),
      languageExpertise: repoStats.languages,
      detailedAnalyses: detailedAnalyses.map(item => ({
        repository: {
          name: item.repository.name,
          full_name: item.repository.full_name,
          description: item.repository.description,
          language: item.repository.language,
          stars: item.repository.stargazers_count,
          forks: item.repository.forks_count,
          url: item.repository.html_url,
        },
        analysis: item.analysis?.data || item.analysis
      })),
    },
    techStackAnalysis: {
      comprehensive: comprehensiveTechStack,
      totalSkillsFound: Object.values(comprehensiveTechStack).reduce((sum, category) => sum + category.length, 0),
      highConfidenceSkills: Object.values(comprehensiveTechStack)
        .flat()
        .filter(skill => skill.confidence >= 80)
        .length,
      primaryTechStack: Object.entries(comprehensiveTechStack)
        .map(([category, skills]) => ({
          category: category.charAt(0).toUpperCase() + category.slice(1),
          topSkills: skills.slice(0, 3)
        }))
        .filter(category => category.topSkills.length > 0)
    },
    careerAnalysis: {
      stats: careerStats,
      experience: data.profileData.experience,
      education: data.profileData.education,
      skills: data.profileData.skills,
    },
    aiInsights: insights,
    overallScore: calculateOverallScore(repoStats, careerStats, data.profileData, githubConnected),
    generatedAt: new Date().toISOString(),
  };
}

function getLanguageDistribution(repositories: RepositoryData[]) {
  const languageCount: Record<string, number> = {};
  const languageStars: Record<string, number> = {};
  
  repositories.forEach(repo => {
    if (repo.language) {
      languageCount[repo.language] = (languageCount[repo.language] || 0) + 1;
      languageStars[repo.language] = (languageStars[repo.language] || 0) + repo.stargazers_count;
    }
  });

  return Object.entries(languageCount)
    .map(([language, count]) => ({
      language,
      repositoryCount: count,
      totalStars: languageStars[language],
      percentage: Math.round((count / repositories.length) * 100),
    }))
    .sort((a, b) => b.repositoryCount - a.repositoryCount)
    .slice(0, 10);
}

function getComprehensiveTechStack(detailedAnalyses: Array<{repository: RepositoryData; analysis: any}>): {
  languages: Array<{name: string, type: 'LANGUAGE', count: number, confidence: number, linesOfCode: number}>,
  frameworks: Array<{name: string, type: 'FRAMEWORK', count: number, confidence: number, linesOfCode: number}>,
  libraries: Array<{name: string, type: 'LIBRARY', count: number, confidence: number, linesOfCode: number}>,
  tools: Array<{name: string, type: 'TOOL', count: number, confidence: number, linesOfCode: number}>,
  databases: Array<{name: string, type: 'DATABASE', count: number, confidence: number, linesOfCode: number}>,
  cloud: Array<{name: string, type: 'CLOUD', count: number, confidence: number, linesOfCode: number}>
} {
  const techStackMap: Map<string, {type: string, count: number, confidence: number, linesOfCode: number}> = new Map();
  
  detailedAnalyses.forEach(({repository, analysis}) => {
    const analysisData = analysis?.data || analysis;
    
    // Extract languages from file analysis
    if (analysisData?.files) {
      analysisData.files.forEach((file: any) => {
        if (file.language) {
          const key = file.language.toLowerCase();
          const existing = techStackMap.get(key) || {type: 'LANGUAGE', count: 0, confidence: 0, linesOfCode: 0};
          techStackMap.set(key, {
            ...existing,
            count: existing.count + 1,
            confidence: Math.max(existing.confidence, 90), // High confidence for detected languages
            linesOfCode: existing.linesOfCode + (file.lines || 0)
          });
        }
      });
    }
    
    // Extract frameworks and libraries from dependencies
    if (analysisData?.dependencies) {
      Object.entries(analysisData.dependencies).forEach(([depType, deps]: [string, any]) => {
        if (Array.isArray(deps)) {
          deps.forEach((dep: any) => {
            if (typeof dep === 'string' || dep.name) {
              const depName = (typeof dep === 'string' ? dep : dep.name).toLowerCase();
              const key = depName;
              const skillType = getSkillType(depName);
              const existing = techStackMap.get(key) || {type: skillType, count: 0, confidence: 0, linesOfCode: 0};
              techStackMap.set(key, {
                ...existing,
                count: existing.count + 1,
                confidence: Math.max(existing.confidence, 85), // High confidence for explicit dependencies
                linesOfCode: existing.linesOfCode + (analysisData?.metrics?.total_lines || 0) / deps.length
              });
            }
          });
        }
      });
    }
    
    // Extract tools from patterns in file names and content
    if (analysisData?.files) {
      analysisData.files.forEach((file: any) => {
        const fileName = file.name?.toLowerCase() || '';
        
        // Detect common tools and configurations
        const toolPatterns = [
          {pattern: /dockerfile|\.docker/, name: 'docker', type: 'TOOL'},
          {pattern: /package\.json/, name: 'npm', type: 'TOOL'},
          {pattern: /yarn\.lock/, name: 'yarn', type: 'TOOL'},
          {pattern: /requirements\.txt/, name: 'pip', type: 'TOOL'},
          {pattern: /cargo\.toml/, name: 'cargo', type: 'TOOL'},
          {pattern: /go\.mod/, name: 'go modules', type: 'TOOL'},
          {pattern: /\.github|\.gitlab/, name: 'ci/cd', type: 'TOOL'},
          {pattern: /webpack\.config/, name: 'webpack', type: 'TOOL'},
          {pattern: /vite\.config/, name: 'vite', type: 'TOOL'},
          {pattern: /next\.config/, name: 'next.js', type: 'FRAMEWORK'},
          {pattern: /nuxt\.config/, name: 'nuxt.js', type: 'FRAMEWORK'},
          {pattern: /angular\.json/, name: 'angular', type: 'FRAMEWORK'},
          {pattern: /vue\.config/, name: 'vue.js', type: 'FRAMEWORK'},
        ];
        
        toolPatterns.forEach(({pattern, name, type}) => {
          if (pattern.test(fileName)) {
            const existing = techStackMap.get(name) || {type, count: 0, confidence: 0, linesOfCode: 0};
            techStackMap.set(name, {
              ...existing,
              count: existing.count + 1,
              confidence: Math.max(existing.confidence, 80), // Good confidence for file patterns
              linesOfCode: existing.linesOfCode + (file.lines || 0)
            });
          }
        });
      });
    }
    
    // Extract cloud services from imports and configurations
    if (analysisData?.imports || analysisData?.files) {
      const cloudPatterns = [
        {pattern: /aws|amazon/i, name: 'aws', type: 'CLOUD'},
        {pattern: /azure|microsoft/i, name: 'azure', type: 'CLOUD'},
        {pattern: /gcp|google.*cloud/i, name: 'google cloud', type: 'CLOUD'},
        {pattern: /firebase/i, name: 'firebase', type: 'CLOUD'},
        {pattern: /vercel/i, name: 'vercel', type: 'CLOUD'},
        {pattern: /netlify/i, name: 'netlify', type: 'CLOUD'},
        {pattern: /heroku/i, name: 'heroku', type: 'CLOUD'},
        {pattern: /supabase/i, name: 'supabase', type: 'DATABASE'},
        {pattern: /mongodb|mongo/i, name: 'mongodb', type: 'DATABASE'},
        {pattern: /postgresql|postgres/i, name: 'postgresql', type: 'DATABASE'},
        {pattern: /mysql/i, name: 'mysql', type: 'DATABASE'},
        {pattern: /redis/i, name: 'redis', type: 'DATABASE'},
      ];
      
      const searchText = JSON.stringify(analysisData).toLowerCase();
      cloudPatterns.forEach(({pattern, name, type}) => {
        if (pattern.test(searchText)) {
          const existing = techStackMap.get(name) || {type, count: 0, confidence: 0, linesOfCode: 0};
          techStackMap.set(name, {
            ...existing,
            count: existing.count + 1,
            confidence: Math.max(existing.confidence, 75), // Moderate confidence for text patterns
            linesOfCode: existing.linesOfCode + (analysisData?.metrics?.total_lines || 0) / 10
          });
        }
      });
    }
  });
  
  // Group by skill type
  const result = {
    languages: [] as Array<{name: string, type: 'LANGUAGE', count: number, confidence: number, linesOfCode: number}>,
    frameworks: [] as Array<{name: string, type: 'FRAMEWORK', count: number, confidence: number, linesOfCode: number}>,
    libraries: [] as Array<{name: string, type: 'LIBRARY', count: number, confidence: number, linesOfCode: number}>,
    tools: [] as Array<{name: string, type: 'TOOL', count: number, confidence: number, linesOfCode: number}>,
    databases: [] as Array<{name: string, type: 'DATABASE', count: number, confidence: number, linesOfCode: number}>,
    cloud: [] as Array<{name: string, type: 'CLOUD', count: number, confidence: number, linesOfCode: number}>
  };
  
  techStackMap.forEach((data, name) => {
    const skill = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      type: data.type as any,
      count: data.count,
      confidence: Math.round(data.confidence),
      linesOfCode: Math.round(data.linesOfCode)
    };
    
    switch (data.type) {
      case 'LANGUAGE':
        result.languages.push(skill);
        break;
      case 'FRAMEWORK':
        result.frameworks.push(skill);
        break;
      case 'LIBRARY':
        result.libraries.push(skill);
        break;
      case 'TOOL':
        result.tools.push(skill);
        break;
      case 'DATABASE':
        result.databases.push(skill);
        break;
      case 'CLOUD':
        result.cloud.push(skill);
        break;
    }
  });
  
  // Sort each category by confidence and count
  Object.values(result).forEach(category => {
    category.sort((a, b) => b.confidence - a.confidence || b.count - a.count);
  });
  
  return result;
}

function getSkillType(skillName: string): string {
  const lowerName = skillName.toLowerCase();
  
  // Frameworks
  const frameworks = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt.js', 'express', 'fastapi', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net'];
  if (frameworks.some(fw => lowerName.includes(fw))) return 'FRAMEWORK';
  
  // Libraries
  const libraries = ['axios', 'lodash', 'moment', 'jquery', 'bootstrap', 'tailwind', 'mui', 'antd', 'chakra', 'pandas', 'numpy', 'tensorflow', 'pytorch'];
  if (libraries.some(lib => lowerName.includes(lib))) return 'LIBRARY';
  
  // Tools
  const tools = ['webpack', 'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress', 'docker', 'kubernetes', 'terraform'];
  if (tools.some(tool => lowerName.includes(tool))) return 'TOOL';
  
  // Databases
  const databases = ['mongodb', 'postgresql', 'mysql', 'redis', 'sqlite', 'dynamodb', 'cassandra', 'elasticsearch'];
  if (databases.some(db => lowerName.includes(db))) return 'DATABASE';
  
  // Cloud
  const cloud = ['aws', 'azure', 'gcp', 'google cloud', 'firebase', 'vercel', 'netlify', 'heroku', 'digitalocean'];
  if (cloud.some(cl => lowerName.includes(cl))) return 'CLOUD';
  
  // Default to library for unknown packages
  return 'LIBRARY';
}

function calculateTotalExperience(experience: any[]): number {
  return experience.reduce((total, exp) => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.current ? new Date() : new Date(exp.endDate || exp.startDate);
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return total + Math.max(years, 0);
  }, 0);
}

function calculateTotalEducation(education: any[]): number {
  return education.reduce((total, edu) => {
    const startDate = new Date(edu.startDate);
    const endDate = edu.current ? new Date() : new Date(edu.endDate || edu.startDate);
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return total + Math.max(years, 0);
  }, 0);
}

function generateCareerInsights(
  data: ProfileAnalysisData, 
  repoStats: any, 
  careerStats: any, 
  githubConnected: boolean = true, 
  detailedAnalyses: Array<{repository: RepositoryData; analysis: any}> = [],
  comprehensiveTechStack?: any
) {
  const insights = [];

  // Repository insights (only if portfolio has GitHub repos)
  if (githubConnected && repoStats.totalRepos > 0) {
    if (repoStats.totalRepos > 5) {
      insights.push(`Strong portfolio with ${repoStats.totalRepos} showcased GitHub repositories demonstrating diverse coding experience.`);
    } else if (repoStats.totalRepos > 0) {
      insights.push(`Curated portfolio with ${repoStats.totalRepos} showcased GitHub repositories demonstrating coding skills.`);
    }

    if (repoStats.totalStars > 50) {
      insights.push(`Impactful portfolio with ${repoStats.totalStars} total stars across showcased repositories.`);
    } else if (repoStats.totalStars > 0) {
      insights.push(`Growing community engagement with ${repoStats.totalStars} stars across portfolio repositories.`);
    }

    // Enhanced insights from actual code analysis
    if (repoStats.totalLinesOfCode > 0) {
      insights.push(`Substantial portfolio codebase with ${(repoStats.totalLinesOfCode / 1000).toFixed(1)}K lines of code analyzed.`);
    }

    if (repoStats.averageQuality > 0) {
      if (repoStats.averageQuality >= 80) {
        insights.push(`Excellent code quality in portfolio with an average score of ${repoStats.averageQuality}% across repositories.`);
      } else if (repoStats.averageQuality >= 60) {
        insights.push(`Good code quality in portfolio with an average score of ${repoStats.averageQuality}% across repositories.`);
      } else {
        insights.push(`Portfolio code quality shows ${repoStats.averageQuality}% average score with room for improvement.`);
      }
    }

    if (repoStats.averageComplexity > 0) {
      if (repoStats.averageComplexity <= 3) {
        insights.push(`Clean, maintainable code architecture in portfolio with low complexity (avg: ${repoStats.averageComplexity}).`);
      } else if (repoStats.averageComplexity <= 5) {
        insights.push(`Moderate code complexity in portfolio (avg: ${repoStats.averageComplexity}) indicating balanced feature richness.`);
      } else {
        insights.push(`High code complexity in portfolio (avg: ${repoStats.averageComplexity}) suggests feature-rich implementations.`);
      }
    }

    // Language expertise insights
    const topLanguage = repoStats.languages[0];
    if (topLanguage) {
      insights.push(`Primary portfolio expertise in ${topLanguage.language} with ${topLanguage.repositoryCount} repositories (${topLanguage.percentage}% of portfolio).`);
    }

    // Security and best practices insights from detailed analysis
    const securityScores = detailedAnalyses
      .map(item => item.analysis?.data?.security?.security_score)
      .filter(score => typeof score === 'number');
    
    if (securityScores.length > 0) {
      const avgSecurity = Math.round(securityScores.reduce((sum, score) => sum + score, 0) / securityScores.length);
      if (avgSecurity >= 80) {
        insights.push(`Strong security practices in portfolio with ${avgSecurity}% average security score.`);
      } else if (avgSecurity >= 60) {
        insights.push(`Good security awareness in portfolio with ${avgSecurity}% average security score.`);
      }
    }

  } else if (!githubConnected) {
    insights.push("No GitHub repositories found in portfolio. Add GitHub projects to your portfolio to unlock coding insights and analysis.");
  }

  // Career progression insights
  if (careerStats.totalYearsExperience > 3) {
    insights.push(`Experienced professional with ${Math.round(careerStats.totalYearsExperience)} years of work experience.`);
  } else if (careerStats.totalYearsExperience > 0) {
    insights.push(`Growing professional with ${Math.round(careerStats.totalYearsExperience)} years of work experience.`);
  }

  if (data.profileData.skills.length > 5) {
    insights.push(`Well-rounded skill set with ${data.profileData.skills.length} documented technical and professional skills.`);
  } else if (data.profileData.skills.length > 0) {
    insights.push(`Foundation skill set with ${data.profileData.skills.length} documented skills. Consider adding more to enhance profile visibility.`);
  }

  // Education-career alignment
  if (data.profileData.education.length > 0 && data.profileData.experience.length > 0) {
    insights.push("Strong educational foundation complemented by practical work experience.");
  } else if (data.profileData.education.length > 0) {
    insights.push("Strong educational background provides solid foundation for career growth.");
  } else if (data.profileData.experience.length > 0) {
    insights.push("Practical work experience demonstrates real-world professional capabilities.");
  }

  // If no insights generated, add default
  if (insights.length === 0) {
    insights.push("Profile analysis ready. Add more information like skills, experience, or education to unlock deeper insights.");
  }

  return {
    strengths: insights,
    careerProgression: analyzeCareerProgression(data.profileData.experience),
    skillGaps: identifySkillGaps(repoStats.languages, data.profileData.skills, githubConnected),
    recommendations: generateRecommendations(data, repoStats, careerStats, githubConnected, detailedAnalyses, comprehensiveTechStack),
  };
}

function analyzeCareerProgression(experience: any[]): string {
  if (experience.length === 0) return "No work experience data available.";
  
  const sortedExp = experience.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  if (sortedExp.length === 1) {
    return `Currently ${sortedExp[0].current ? 'working' : 'worked'} as ${sortedExp[0].jobTitle} at ${sortedExp[0].companyName}.`;
  }
  
  return `Career progression from ${sortedExp[0].jobTitle} to ${sortedExp[sortedExp.length - 1].jobTitle}, showing growth across ${sortedExp.length} roles.`;
}

function identifySkillGaps(languages: any[], skills: any[], githubConnected: boolean = true): string[] {
  const gaps: string[] = [];
  
  if (!githubConnected) {
    gaps.push("Connect GitHub to get coding language insights and identify skill gaps");
    
    // General skill recommendations for profiles without GitHub
    const skillNames = skills.map(s => s.name.toLowerCase());
    const basicTechSkills = ['javascript', 'python', 'sql', 'git', 'html', 'css'];
    
    basicTechSkills.forEach(tech => {
      if (!skillNames.some(skill => skill.includes(tech))) {
        gaps.push(`Consider adding ${tech} to your skill set`);
      }
    });
    
    return gaps.slice(0, 3);
  }
  
  const skillNames = skills.map(s => s.name.toLowerCase());
  
  // Check if popular languages are missing from skills
  const popularTechSkills = ['javascript', 'python', 'react', 'node.js', 'docker', 'aws', 'git'];
  
  popularTechSkills.forEach(tech => {
    if (!skillNames.some(skill => skill.includes(tech))) {
      gaps.push(`Consider adding ${tech} to your skill set`);
    }
  });
  
  return gaps.slice(0, 3); // Limit to top 3 suggestions
}

function generateRecommendations(
  data: ProfileAnalysisData, 
  repoStats: any, 
  careerStats: any, 
  githubConnected: boolean = true, 
  detailedAnalyses: Array<{repository: RepositoryData; analysis: any}> = [],
  comprehensiveTechStack?: any
): string[] {
  const recommendations = [];
  
  // GitHub-specific recommendations
  if (!githubConnected) {
    recommendations.push("Connect your GitHub account to showcase your coding projects and get repository-based insights.");
  } else if (repoStats.totalRepos < 5) {
    recommendations.push("Build more projects to showcase your skills and attract potential employers.");
  }
  
  // Profile completeness recommendations
  if (data.profileData.bio === null || data.profileData.bio?.length < 50) {
    recommendations.push("Add a comprehensive bio to better describe your professional background and interests.");
  }
  
  if (data.profileData.skills.length < 8) {
    recommendations.push("Add more skills to your profile to improve discoverability and showcase your expertise.");
  }
  
  // Experience and education recommendations
  if (data.profileData.experience.length === 0) {
    recommendations.push("Add work experience to demonstrate your professional background and career progression.");
  }
  
  if (data.profileData.education.length === 0) {
    recommendations.push("Add educational background to provide context for your qualifications and learning journey.");
  }
  
  // Advanced recommendations for connected profiles
  if (githubConnected && repoStats.languages.length > 3) {
    recommendations.push("Consider specializing in 2-3 core technologies while maintaining your diverse skill set.");
  }
  
  // Code quality recommendations from detailed analysis
  if (detailedAnalyses.length > 0) {
    const avgQuality = repoStats.averageQuality;
    if (avgQuality > 0 && avgQuality < 70) {
      recommendations.push("Focus on improving code quality through better documentation, testing, and architectural patterns.");
    }
    
    const avgComplexity = repoStats.averageComplexity;
    if (avgComplexity > 5) {
      recommendations.push("Consider refactoring complex code sections to improve maintainability and readability.");
    }
    
    // Security recommendations
    const securityScores = detailedAnalyses
      .map(item => item.analysis?.data?.security?.security_score)
      .filter(score => typeof score === 'number');
    
    if (securityScores.length > 0) {
      const avgSecurity = securityScores.reduce((sum, score) => sum + score, 0) / securityScores.length;
      if (avgSecurity < 70) {
        recommendations.push("Enhance security practices by addressing identified vulnerabilities and following security best practices.");
      }
    }
  }
  
  return recommendations.slice(0, 4);
}

function calculateOverallScore(repoStats: any, careerStats: any, profileData: any, githubConnected: boolean = true): number {
  let score = 0;
  
  if (githubConnected) {
    // Repository contribution (30% when GitHub connected)
    score += Math.min(30, (repoStats.totalRepos * 2));
    score += Math.min(20, (repoStats.totalStars * 0.5));
  } else {
    // When GitHub not connected, redistribute scoring
    // Give some base points for having a complete profile instead
    if (profileData.bio && profileData.bio.length > 50) score += 15;
    if (profileData.headline) score += 10;
    if (profileData.skills.length > 3) score += 15;
    if (profileData.location) score += 5;
    if (profileData.college) score += 5;
  }
  
  // Career experience (25%)
  score += Math.min(25, (careerStats.totalYearsExperience * 5));
  
  // Profile completeness (25%)
  if (profileData.bio) score += 5;
  if (profileData.headline) score += 5;
  if (profileData.skills.length > 5) score += 10;
  if (profileData.experience.length > 0) score += 5;
  
  // Education (20%)
  score += Math.min(20, (profileData.education.length * 10));
  
  return Math.min(100, Math.round(score));
}