"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { saveProfileAnalysisAsProject } from "@/actions/profileAnalysisResult";
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
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";

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
  const [analysisData, setAnalysisData] = useState<ProfileAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

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
        // Save to database
        const result = await saveProfileAnalysisAsProject(
          params.username,
          analysisData
        );
        
        if (result.success) {
          console.log('Profile analysis saved to database', result);
          setIsSaved(true);
        } else {
          console.error('Failed to save profile analysis to database:', result.error);
        }
      }
    };
    
    saveAnalysisToDb();
  }, [analysisData, isSaved, params.username]);

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

  const COLORS = ['#000000', '#404040', '#808080', '#a0a0a0', '#c0c0c0'];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push(`/${params.username}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Complete Profile Analysis</h1>
                <p className="text-muted-foreground">
                  Comprehensive analysis of {analysisData.profileSummary.name}'s profile and repositories
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{analysisData.overallScore}/100</div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">
                  {analysisData.profileSummary.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{analysisData.profileSummary.name}</h3>
                <p className="text-muted-foreground">@{analysisData.profileSummary.username}</p>
                {analysisData.profileSummary.headline && (
                  <p className="text-primary font-medium mt-1">{analysisData.profileSummary.headline}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                </div>
              </div>
            </div>
            {analysisData.profileSummary.bio && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm">{analysisData.profileSummary.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repository Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Repository Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">
                    {analysisData.repositoryAnalysis.stats.totalRepos}
                  </div>
                  <div className="text-sm text-muted-foreground">Repositories</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-500 flex items-center justify-center gap-1">
                    <Star className="h-5 w-5" />
                    {analysisData.repositoryAnalysis.stats.totalStars}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Stars</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-500 flex items-center justify-center gap-1">
                    <GitFork className="h-5 w-5" />
                    {analysisData.repositoryAnalysis.stats.totalForks}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Forks</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {Math.round(analysisData.repositoryAnalysis.stats.averageRepoSize / 1024)}KB
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Size</div>
                </div>
              </div>
              
              {/* Additional code quality metrics if available */}
              {(analysisData.repositoryAnalysis.stats.totalLinesOfCode || 
                analysisData.repositoryAnalysis.stats.averageComplexity || 
                analysisData.repositoryAnalysis.stats.averageQuality) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  {analysisData.repositoryAnalysis.stats.totalLinesOfCode && (
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-500">
                        {Math.round(analysisData.repositoryAnalysis.stats.totalLinesOfCode / 1000)}K
                      </div>
                      <div className="text-xs text-muted-foreground">Lines of Code</div>
                    </div>
                  )}
                  {analysisData.repositoryAnalysis.stats.averageComplexity && (
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <div className="text-lg font-bold text-orange-500">
                        {analysisData.repositoryAnalysis.stats.averageComplexity}
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Complexity</div>
                    </div>
                  )}
                  {analysisData.repositoryAnalysis.stats.averageQuality && (
                    <div className="bg-muted/30 p-4 rounded-lg text-center">
                      <div className="text-lg font-bold text-emerald-500">
                        {analysisData.repositoryAnalysis.stats.averageQuality}%
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Quality</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Language Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.repositoryAnalysis.languageExpertise.length > 0 ? (
                <div className="h-64">
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
                        {analysisData.repositoryAnalysis.languageExpertise.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        </div>

        {/* Top Repositories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisData.repositoryAnalysis.topRepositories.map((repo, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{repo.name}</h4>
                      {repo.language && (
                        <Badge variant="secondary" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {repo.description || "No description available"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {repo.stars}
                    </div>
                    <div className="flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      {repo.forks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Repository Analyses */}
        {analysisData.repositoryAnalysis.detailedAnalyses && 
         analysisData.repositoryAnalysis.detailedAnalyses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Detailed Repository Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysisData.repositoryAnalysis.detailedAnalyses.map((repoAnalysis, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-lg">{repoAnalysis.repository.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {repoAnalysis.repository.description || "No description available"}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {repoAnalysis.repository.language && (
                            <Badge variant="secondary">{repoAnalysis.repository.language}</Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4" />
                            {repoAnalysis.repository.stars}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-4 w-4" />
                            {repoAnalysis.repository.forks}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(repoAnalysis.repository.url, '_blank')}
                      >
                        View on GitHub
                      </Button>
                    </div>
                    
                    {repoAnalysis.analysis && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Code Metrics */}
                        {repoAnalysis.analysis.metrics && (
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">Code Metrics</h5>
                            <div className="space-y-1 text-xs">
                              {repoAnalysis.analysis.metrics.total_lines && (
                                <div>Lines: {repoAnalysis.analysis.metrics.total_lines.toLocaleString()}</div>
                              )}
                              {repoAnalysis.analysis.metrics.complexity && (
                                <div>Complexity: {repoAnalysis.analysis.metrics.complexity}</div>
                              )}
                              {repoAnalysis.analysis.metrics.maintainability && (
                                <div>Maintainability: {repoAnalysis.analysis.metrics.maintainability}%</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Quality Metrics */}
                        {repoAnalysis.analysis.quality && (
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">Quality</h5>
                            <div className="space-y-1 text-xs">
                              {repoAnalysis.analysis.quality.architecture_score && (
                                <div>Architecture: {repoAnalysis.analysis.quality.architecture_score}%</div>
                              )}
                              {repoAnalysis.analysis.quality.documentation_coverage && (
                                <div>Documentation: {repoAnalysis.analysis.quality.documentation_coverage}%</div>
                              )}
                              {repoAnalysis.analysis.quality.test_files && (
                                <div>Test Files: {repoAnalysis.analysis.quality.test_files}</div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Security */}
                        {repoAnalysis.analysis.security && (
                          <div className="bg-muted/30 p-3 rounded-lg">
                            <h5 className="font-medium text-sm mb-2">Security</h5>
                            <div className="space-y-1 text-xs">
                              {repoAnalysis.analysis.security.security_score && (
                                <div>Security Score: {repoAnalysis.analysis.security.security_score}%</div>
                              )}
                              {repoAnalysis.analysis.security.critical_issues && (
                                <div>Critical Issues: {repoAnalysis.analysis.security.critical_issues.length}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* AI Insights for this repository */}
                    {repoAnalysis.analysis?.ai_insights && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <h5 className="font-medium text-sm mb-2 text-blue-700 dark:text-blue-300">
                          AI Assessment
                        </h5>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {repoAnalysis.analysis.ai_insights.code_assessment || 
                           repoAnalysis.analysis.ai_insights.overall_score ? 
                           `Overall Score: ${repoAnalysis.analysis.ai_insights.overall_score}/100` : 
                           "Analysis completed"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Career Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Career Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(analysisData.careerAnalysis.stats.totalYearsExperience)}
                  </div>
                  <div className="text-sm text-muted-foreground">Years Experience</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {analysisData.careerAnalysis.stats.skillsCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Skills</div>
                </div>
              </div>
              
              {analysisData.careerAnalysis.stats.currentRole && (
                <div className="bg-primary/10 p-4 rounded-lg">
                  <div className="text-sm font-medium text-primary">Current Role</div>
                  <div className="font-semibold">
                    {analysisData.careerAnalysis.stats.currentRole.jobTitle}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    at {analysisData.careerAnalysis.stats.currentRole.companyName}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education & Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {Math.round(analysisData.careerAnalysis.stats.totalEducationYears)}
                </div>
                <div className="text-sm text-muted-foreground">Years of Education</div>
              </div>
              
              {analysisData.careerAnalysis.stats.currentEducation && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Currently Studying
                  </div>
                  <div className="font-semibold">
                    {analysisData.careerAnalysis.stats.currentEducation.degree || 
                     analysisData.careerAnalysis.stats.currentEducation.fieldOfStudy}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    at {analysisData.careerAnalysis.stats.currentEducation.institution}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Strengths & Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.aiInsights.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Award className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{strength}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.aiInsights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Career Progression */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Career Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{analysisData.aiInsights.careerProgression}</p>
            
            {analysisData.careerAnalysis.experience.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Experience Timeline</h4>
                <div className="space-y-3">
                  {analysisData.careerAnalysis.experience.map((exp, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${exp.current ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{exp.jobTitle}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {exp.companyName}
                          {exp.location && (
                            <>
                              <span>•</span>
                              <MapPin className="h-4 w-4" />
                              {exp.location}
                            </>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(exp.startDate)} - {exp.current ? 'Present' : exp.endDate ? formatDate(exp.endDate) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overall Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Profile Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-primary">{analysisData.overallScore}/100</div>
                <div className="text-muted-foreground">Professional Profile Rating</div>
              </div>
              <div className={`w-16 h-16 rounded-full ${getScoreColor(analysisData.overallScore)} flex items-center justify-center text-white font-bold`}>
                {analysisData.overallScore}
              </div>
            </div>
            <Progress value={analysisData.overallScore} className="h-2 mb-4" />
            <p className="text-sm text-muted-foreground">
              This score is calculated based on repository activity, career experience, profile completeness, and educational background.
            </p>
          </CardContent>
        </Card>

        {/* Analysis Metadata */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Analysis completed on {new Date(analysisData.generatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileAnalysisResults;