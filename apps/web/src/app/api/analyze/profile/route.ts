import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/data/user";
import { fetchUserGithubRepos } from "@/actions/portfolioActions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
      const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
      controller.enqueue(chunk);
    }
  };
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

          // Step 2: Get user's GitHub repositories
          sendEvent({ step: "Fetching GitHub repositories...", progress: 25 });
          
          try {
            // Check if user has GitHub connected
            const supabase = await createSupabaseServerClient();
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (!currentUser) {
              sendEvent({ error: "Authentication required" });
              controller.close();
              return;
            }

            const reposResult = await fetchUserGithubRepos();
            console.log("GitHub repos result:", reposResult);
            
            if (!reposResult.connected) {
              sendEvent({ error: "GitHub account not connected. Please connect your GitHub account first." });
              controller.close();
              return;
            }
            
            if (reposResult.error) {
              sendEvent({ error: reposResult.error });
              controller.close();
              return;
            }

            const repositories = (reposResult.repos as RepositoryData[]) || [];
            console.log("Found repositories:", repositories.length);

            // Step 3: Prepare profile data
            sendEvent({ step: "Organizing profile information...", progress: 40 });
            
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

            // Step 4: Analyze repositories (simulate analysis for now)
            sendEvent({ step: "Analyzing repository content and patterns...", progress: 60 });
            
            // Simulate some processing time
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 5: Generate comprehensive insights
            sendEvent({ step: "Generating comprehensive career insights...", progress: 80 });
            
            // Create analysis result (for now, we'll create a mock analysis)
            const analysisResult = await generateProfileAnalysis(profileData);

            // Step 6: Complete
            sendEvent({ 
              step: "Analysis complete!", 
              progress: 100,
              result: analysisResult 
            });

          } catch (repoError) {
            console.error("GitHub repos fetch error:", repoError);
            sendEvent({ error: "Failed to fetch GitHub repositories. Please try again." });
            controller.close();
            return;
          }

          controller.close();
        } catch (error) {
          console.error("Profile analysis error:", error);
          sendEvent({ 
            error: error instanceof Error ? error.message : "Analysis failed" 
          });
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

async function generateProfileAnalysis(data: ProfileAnalysisData) {
  // Calculate repository statistics
  const repoStats = {
    totalRepos: data.repositories.length,
    totalStars: data.repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: data.repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
    languages: getLanguageDistribution(data.repositories),
    averageRepoSize: data.repositories.length > 0 
      ? Math.round(data.repositories.reduce((sum, repo) => sum + repo.size, 0) / data.repositories.length)
      : 0,
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
  const insights = generateCareerInsights(data, repoStats, careerStats);

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
    },
    careerAnalysis: {
      stats: careerStats,
      experience: data.profileData.experience,
      education: data.profileData.education,
      skills: data.profileData.skills,
    },
    aiInsights: insights,
    overallScore: calculateOverallScore(repoStats, careerStats, data.profileData),
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

function generateCareerInsights(data: ProfileAnalysisData, repoStats: any, careerStats: any) {
  const insights = [];

  // Repository insights
  if (repoStats.totalRepos > 10) {
    insights.push(`Highly productive developer with ${repoStats.totalRepos} repositories showcasing diverse coding experience.`);
  }

  if (repoStats.totalStars > 50) {
    insights.push(`Strong community impact with ${repoStats.totalStars} total stars across repositories.`);
  }

  // Language expertise insights
  const topLanguage = repoStats.languages[0];
  if (topLanguage) {
    insights.push(`Primary expertise in ${topLanguage.language} with ${topLanguage.repositoryCount} repositories (${topLanguage.percentage}% of portfolio).`);
  }

  // Career progression insights
  if (careerStats.totalYearsExperience > 3) {
    insights.push(`Experienced professional with ${Math.round(careerStats.totalYearsExperience)} years of work experience.`);
  }

  if (data.profileData.skills.length > 5) {
    insights.push(`Well-rounded skill set with ${data.profileData.skills.length} documented technical and professional skills.`);
  }

  // Education-career alignment
  if (data.profileData.education.length > 0 && data.profileData.experience.length > 0) {
    insights.push("Strong educational foundation complemented by practical work experience.");
  }

  return {
    strengths: insights,
    careerProgression: analyzeCareerProgression(data.profileData.experience),
    skillGaps: identifySkillGaps(repoStats.languages, data.profileData.skills),
    recommendations: generateRecommendations(data, repoStats, careerStats),
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

function identifySkillGaps(languages: any[], skills: any[]): string[] {
  const gaps: string[] = [];
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

function generateRecommendations(data: ProfileAnalysisData, repoStats: any, careerStats: any): string[] {
  const recommendations = [];
  
  if (repoStats.totalRepos < 5) {
    recommendations.push("Build more projects to showcase your skills and attract potential employers.");
  }
  
  if (data.profileData.bio === null || data.profileData.bio?.length < 50) {
    recommendations.push("Add a comprehensive bio to better describe your professional background and interests.");
  }
  
  if (data.profileData.skills.length < 8) {
    recommendations.push("Add more skills to your profile to improve discoverability and showcase your expertise.");
  }
  
  if (repoStats.languages.length > 3) {
    recommendations.push("Consider specializing in 2-3 core technologies while maintaining your diverse skill set.");
  }
  
  return recommendations.slice(0, 4);
}

function calculateOverallScore(repoStats: any, careerStats: any, profileData: any): number {
  let score = 0;
  
  // Repository contribution (30%)
  score += Math.min(30, (repoStats.totalRepos * 2));
  score += Math.min(20, (repoStats.totalStars * 0.5));
  
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