'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  MessageCircle, 
  Eye, 
  ThumbsUp, 
  ThumbsDown, 
  MapPin, 
  Clock,
  Code,
  Award,
  Lightbulb
} from 'lucide-react';

interface CandidateMatch {
  id: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    headline?: string;
    cruismScore: number;
    topSkills: string[];
    location?: string;
    experienceYears: number;
    githubUrl?: string;
    linkedinUrl?: string;
  };
  aiMatchScore: number;
  matchReasoning: {
    strengths: string[];
    concerns: string[];
    summary: string;
    skillsMatchScore: number;
    experienceMatchScore: number;
    codeQualityScore: number;
  };
  recruiterRating?: number;
  status: string;
  createdAt: string;
}

interface CandidateRankingProps {
  jobPostingId?: string;
}

const fetchCandidateMatches = async (jobPostingId: string, filterStatus: string) => {
  try {
    const response = await fetch(`/api/recruitment/search-candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_posting_id: jobPostingId,
        max_candidates: 50,
        min_match_score: 60.0,
        filters: {
          status: filterStatus !== 'all' ? filterStatus : undefined
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch candidates: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform API response to component format
    return data.matches.map((match: any) => ({
      id: match.candidate_id,
      candidate: {
        id: match.candidate_profile.id,
        firstName: match.candidate_profile.first_name,
        lastName: match.candidate_profile.last_name,
        profilePicture: `/api/placeholder/64/64`, // Default for now
        headline: `${match.candidate_profile.primary_domain} Developer with ${match.candidate_profile.experience_years} years experience`,
        cruismScore: match.candidate_profile.cruism_score,
        topSkills: match.candidate_profile.skills.slice(0, 5), // Top 5 skills
        location: match.candidate_profile.location,
        experienceYears: match.candidate_profile.experience_years,
        githubUrl: match.candidate_profile.github_url,
        linkedinUrl: match.candidate_profile.linkedin_url
      },
      aiMatchScore: match.ai_match_score,
      matchReasoning: {
        strengths: match.match_reasoning.strengths,
        concerns: match.match_reasoning.concerns,
        summary: match.match_reasoning.summary,
        skillsMatchScore: match.match_reasoning.skills_match_score,
        experienceMatchScore: match.match_reasoning.experience_match_score,
        codeQualityScore: match.match_reasoning.code_quality_score
      },
      recruiterRating: match.recruiter_rating,
      status: match.status,
      createdAt: match.created_at
    }));
  } catch (error) {
    console.error('Error fetching candidate matches:', error);
    // Return empty array on error - component will handle loading/error states
    return [];
  }
  
  // Keep this as fallback mock data for development
  const mockCandidates: CandidateMatch[] = [
    {
      id: '1',
      candidate: {
        id: 'user1',
        firstName: 'Alice',
        lastName: 'Johnson',
        profilePicture: '/api/placeholder/64/64',
        headline: 'Senior Full Stack Developer passionate about clean code',
        cruismScore: 87,
        topSkills: ['React', 'Python', 'PostgreSQL', 'AWS', 'Docker'],
        location: 'San Francisco, CA',
        experienceYears: 5,
        githubUrl: 'https://github.com/alicejohnson',
        linkedinUrl: 'https://linkedin.com/in/alicejohnson'
      },
      aiMatchScore: 92,
      matchReasoning: {
        strengths: [
          'Excellent skills match with React, Python, and PostgreSQL',
          'Strong code quality with 87 CRUISM score',
          'Perfect experience level for senior role',
          'Active open source contributor'
        ],
        concerns: [
          'Limited AWS experience in recent projects'
        ],
        summary: 'Outstanding candidate with exceptional technical skills and perfect experience alignment.',
        skillsMatchScore: 95,
        experienceMatchScore: 90,
        codeQualityScore: 87
      },
      recruiterRating: 5,
      status: 'contacted',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      candidate: {
        id: 'user2',
        firstName: 'Bob',
        lastName: 'Smith',
        profilePicture: '/api/placeholder/64/64',
        headline: 'Backend Engineer specializing in scalable systems',
        cruismScore: 75,
        topSkills: ['Java', 'Spring Boot', 'MySQL', 'Kubernetes', 'Redis'],
        location: 'New York, NY',
        experienceYears: 8,
        githubUrl: 'https://github.com/bobsmith'
      },
      aiMatchScore: 78,
      matchReasoning: {
        strengths: [
          'Strong backend experience with Java and Spring',
          'Extensive experience with scalable systems',
          'Good code quality practices'
        ],
        concerns: [
          'Limited frontend experience with React',
          'May be overqualified for this role',
          'Different tech stack focus'
        ],
        summary: 'Solid backend engineer but may need frontend upskilling for full stack role.',
        skillsMatchScore: 70,
        experienceMatchScore: 85,
        codeQualityScore: 75
      },
      status: 'suggested',
      createdAt: '2024-01-15T10:05:00Z'
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return filterStatus === 'all' 
    ? mockCandidates 
    : mockCandidates.filter(c => c.status === filterStatus);
};

export function CandidateRanking({ jobPostingId }: CandidateRankingProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const { data: candidates, isLoading, error } = useQuery({
    queryKey: ['candidate-matches', jobPostingId, filterStatus],
    queryFn: () => fetchCandidateMatches(jobPostingId!, filterStatus),
    enabled: !!jobPostingId, // Only run query if jobPostingId exists
  });

  const handleContactCandidate = (candidateId: string) => {
    // TODO: Launch outreach modal
    console.log('Contact candidate:', candidateId);
  };

  const handleRateCandidate = (candidateId: string, rating: number) => {
    // TODO: Update recruiter rating
    console.log('Rate candidate:', candidateId, rating);
  };

  const handleViewProfile = (candidateId: string) => {
    // TODO: Navigate to candidate profile
    console.log('View profile:', candidateId);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  // Show job posting selection if no jobPostingId provided
  if (!jobPostingId) {
    return (
      <div className="text-center py-12 space-y-4">
        <h3 className="text-xl font-semibold">No Job Posting Selected</h3>
        <p className="text-muted-foreground">
          Create or select a job posting to find and rank candidates using AI.
        </p>
        <Button>
          Create Job Posting
        </Button>
      </div>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'contacted': return 'default';
      case 'responded': return 'secondary';
      case 'interviewed': return 'outline';
      case 'hired': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding the best candidates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading candidates. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI-Ranked Candidates</h2>
          <p className="text-muted-foreground">
            {candidates?.length || 0} candidates matched using advanced AI analysis
          </p>
        </div>
        
        {/* Status Filters */}
        <div className="flex gap-2">
          {['all', 'suggested', 'contacted', 'responded', 'interviewed'].map((status) => (
            <Button 
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Candidates List */}
      <div className="grid gap-4">
        {candidates?.map((match: CandidateMatch) => (
          <Card key={match.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <Avatar className="w-16 h-16">
                <AvatarImage src={match.candidate.profilePicture} />
                <AvatarFallback>
                  {match.candidate.firstName[0]}{match.candidate.lastName[0]}
                </AvatarFallback>
              </Avatar>

              {/* Main Content */}
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {match.candidate.firstName} {match.candidate.lastName}
                    </h3>
                    <p className="text-muted-foreground">{match.candidate.headline}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {match.candidate.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {match.candidate.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {match.candidate.experienceYears} years experience
                      </div>
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full ${getMatchScoreColor(match.aiMatchScore)} text-white flex items-center justify-center font-bold text-lg`}>
                      {match.aiMatchScore}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">AI Match</p>
                  </div>
                </div>

                {/* Metrics Bar */}
                <div className="flex items-center gap-6">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    CRUISM: {match.candidate.cruismScore}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(match.status)}>
                    {match.status.charAt(0).toUpperCase() + match.status.slice(1)}
                  </Badge>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1">
                  {match.candidate.topSkills.map((skill: string) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>

                {/* Match Analysis */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Skills Match</p>
                        <Progress value={match.matchReasoning.skillsMatchScore} className="h-2" />
                        <p className="text-xs font-medium">{match.matchReasoning.skillsMatchScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <Progress value={match.matchReasoning.experienceMatchScore} className="h-2" />
                        <p className="text-xs font-medium">{match.matchReasoning.experienceMatchScore}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Code Quality</p>
                        <Progress value={match.matchReasoning.codeQualityScore} className="h-2" />
                        <p className="text-xs font-medium">{match.matchReasoning.codeQualityScore}%</p>
                      </div>
                    </div>
                    
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="strengths">Strengths</TabsTrigger>
                        <TabsTrigger value="concerns">Concerns</TabsTrigger>
                      </TabsList>
                      <TabsContent value="summary" className="mt-3">
                        <p className="text-sm">{match.matchReasoning.summary}</p>
                      </TabsContent>
                      <TabsContent value="strengths" className="mt-3">
                        <ul className="text-sm space-y-1">
                          {match.matchReasoning.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ThumbsUp className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                      <TabsContent value="concerns" className="mt-3">
                        {match.matchReasoning.concerns.length > 0 ? (
                          <ul className="text-sm space-y-1">
                            {match.matchReasoning.concerns.map((concern: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Lightbulb className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                {concern}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No concerns identified</p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground mr-2">Your rating:</span>
                    {[1, 2, 3, 4, 5].map((star: number) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 cursor-pointer transition-colors ${
                          star <= (match.recruiterRating || 0) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                        onClick={() => handleRateCandidate(match.candidate.id, star)}
                      />
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewProfile(match.candidate.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Profile
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleContactCandidate(match.candidate.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {candidates?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No candidates found for the current filters.</p>
        </div>
      )}
    </div>
  );
}