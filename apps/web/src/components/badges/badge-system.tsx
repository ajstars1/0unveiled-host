'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  Check, 
  Clock, 
  Award, 
  Shield, 
  Brain, 
  Code, 
  Users, 
  Trophy,
  Upload,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  category: 'TECHNICAL' | 'QUALITY' | 'SECURITY' | 'LEADERSHIP' | 'COMMUNITY' | 'ACHIEVEMENT';
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  pointsValue: number;
  isEarned?: boolean;
  earnedAt?: string;
  isFeatured?: boolean;
  criteria?: any;
  progress?: number;
}

interface UserBadge extends BadgeData {
  isEarned: true;
  earnedAt: string;
  verificationRequestId?: string;
  evidenceUrl?: string;
}

interface VerificationOpportunity {
  verificationType: string;
  badgeName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  requirementsMet: number;
  description: string;
}

interface BadgeSystemProps {
  userId: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'TECHNICAL': return <Code className="w-4 h-4" />;
    case 'QUALITY': return <Award className="w-4 h-4" />;
    case 'SECURITY': return <Shield className="w-4 h-4" />;
    case 'LEADERSHIP': return <Users className="w-4 h-4" />;
    case 'COMMUNITY': return <Users className="w-4 h-4" />;
    case 'ACHIEVEMENT': return <Trophy className="w-4 h-4" />;
    default: return <Award className="w-4 h-4" />;
  }
};

const getRarityColors = (rarity: string) => {
  switch (rarity) {
    case 'COMMON': return 'bg-gray-100 border-gray-300 text-gray-800';
    case 'RARE': return 'bg-blue-100 border-blue-300 text-blue-800';
    case 'EPIC': return 'bg-purple-100 border-purple-300 text-purple-800';
    case 'LEGENDARY': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'text-green-600';
    case 'Medium': return 'text-yellow-600';
    case 'Hard': return 'text-red-600';
    default: return 'text-gray-600';
  }
};

function BadgeCard({ badge, size = 'normal', showProgress = false }: { 
  badge: BadgeData; 
  size?: 'normal' | 'large';
  showProgress?: boolean;
}) {
  const rarityColors = getRarityColors(badge.rarity);
  const categoryIcon = getCategoryIcon(badge.category);

  return (
    <div className={`
      relative p-4 rounded-lg border-2 transition-all hover:shadow-lg cursor-pointer
      ${rarityColors}
      ${size === 'large' ? 'p-6' : 'p-4'}
    `}>
      <div className="text-center">
        {/* Badge Icon */}
        <div className={`
          mx-auto mb-3 rounded-full bg-white/50 flex items-center justify-center
          ${size === 'large' ? 'w-20 h-20' : 'w-16 h-16'}
        `}>
          {badge.iconUrl ? (
            <img 
              src={badge.iconUrl} 
              alt={badge.name}
              className={size === 'large' ? 'w-12 h-12' : 'w-10 h-10'}
            />
          ) : (
            <div className={size === 'large' ? 'text-2xl' : 'text-xl'}>
              {categoryIcon}
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="space-y-2">
          <h3 className={`font-semibold ${size === 'large' ? 'text-lg' : 'text-sm'}`}>
            {badge.name}
          </h3>
          <p className={`text-xs opacity-80 ${size === 'large' ? 'text-sm' : 'text-xs'}`}>
            {badge.description}
          </p>

          {/* Status Indicators */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {badge.isEarned ? (
              <Badge variant="secondary" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Available
              </Badge>
            )}
            
            <Badge variant="outline" className="text-xs">
              {badge.pointsValue} pts
            </Badge>
          </div>

          {/* Progress Bar for Available Badges */}
          {showProgress && !badge.isEarned && badge.progress !== undefined && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{badge.progress}%</span>
              </div>
              <Progress value={badge.progress} className="h-2" />
            </div>
          )}

          {/* Earned Date */}
          {badge.isEarned && badge.earnedAt && (
            <p className="text-xs opacity-70 mt-2">
              Earned {new Date(badge.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Featured Badge Indicator */}
      {badge.isFeatured && (
        <div className="absolute -top-2 -right-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        </div>
      )}
    </div>
  );
}

function BadgeGrid({ badges, showProgress = false }: { 
  badges: BadgeData[]; 
  showProgress?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {badges.map((badge) => (
        <BadgeCard key={badge.id} badge={badge} showProgress={showProgress} />
      ))}
    </div>
  );
}

function VerificationCenter({ userId }: { userId: string }) {
  const mockOpportunities: VerificationOpportunity[] = [
    {
      verificationType: 'CODE_QUALITY',
      badgeName: 'Code Quality Expert',
      difficulty: 'Medium',
      estimatedTime: '2-3 days',
      requirementsMet: 85,
      description: 'Demonstrate exceptional code quality across multiple projects with high CRUISM scores.'
    },
    {
      verificationType: 'OPEN_SOURCE_CONTRIBUTOR',
      badgeName: 'Open Source Hero',
      difficulty: 'Easy',
      estimatedTime: '1-2 days',
      requirementsMet: 95,
      description: 'Verify your contributions to open source projects and community involvement.'
    },
    {
      verificationType: 'SECURITY_EXPERT',
      badgeName: 'Security Guardian',
      difficulty: 'Hard',
      estimatedTime: '1-2 weeks',
      requirementsMet: 45,
      description: 'Prove expertise in application security, vulnerability assessment, and secure coding practices.'
    },
    {
      verificationType: 'AI_SPECIALIST',
      badgeName: 'AI Pioneer',
      difficulty: 'Hard',
      estimatedTime: '1-2 weeks',
      requirementsMet: 60,
      description: 'Showcase mastery in artificial intelligence and machine learning technologies.'
    }
  ];

  const [selectedVerification, setSelectedVerification] = useState<string | null>(null);

  const getRequirementColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRequirementIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (percentage >= 60) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold mb-2">Get Verified</h3>
        <p className="text-muted-foreground">
          Showcase your expertise and earn verified badges that recruiters trust
        </p>
      </div>

      <div className="grid gap-4">
        {mockOpportunities.map((opportunity) => (
          <Card key={opportunity.verificationType} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{opportunity.badgeName}</h4>
                  <p className="text-muted-foreground text-sm mb-2">{opportunity.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`font-medium ${getDifficultyColor(opportunity.difficulty)}`}>
                      {opportunity.difficulty}
                    </span>
                    <span className="text-muted-foreground">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {opportunity.estimatedTime}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  {getRequirementIcon(opportunity.requirementsMet)}
                  <p className={`text-sm font-medium ${getRequirementColor(opportunity.requirementsMet)}`}>
                    {opportunity.requirementsMet}%
                  </p>
                  <p className="text-xs text-muted-foreground">Ready</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Requirements Met</span>
                  <span className={getRequirementColor(opportunity.requirementsMet)}>
                    {opportunity.requirementsMet}%
                  </span>
                </div>
                <Progress value={opportunity.requirementsMet} className="h-2" />
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View Requirements
                </Button>
                
                <Button 
                  size="sm"
                  disabled={opportunity.requirementsMet < 60}
                  onClick={() => setSelectedVerification(opportunity.verificationType)}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {opportunity.requirementsMet >= 80 ? 'Start Verification' : 'Need More Progress'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Why Get Verified?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <Shield className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">Build Trust</p>
              <p className="text-muted-foreground">Verified badges show recruiters your skills are real</p>
            </div>
            <div>
              <Star className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">Stand Out</p>
              <p className="text-muted-foreground">Get featured in search results and recommendations</p>
            </div>
            <div>
              <Award className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">Unlock Opportunities</p>
              <p className="text-muted-foreground">Access exclusive job postings and higher match scores</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function BadgeShowcase({ userId }: BadgeSystemProps) {
  // Mock data - in real app, this would come from API
  const mockUserBadges: UserBadge[] = [
    {
      id: 'ub1',
      name: 'Code Quality Expert',
      description: 'Verified exceptional code quality across multiple projects',
      category: 'QUALITY',
      rarity: 'RARE',
      pointsValue: 500,
      isEarned: true,
      earnedAt: '2024-01-15T10:00:00Z',
      isFeatured: true,
      verificationRequestId: 'vr1'
    },
    {
      id: 'ub2',
      name: 'High Performer',
      description: 'Top 100 performer on the global leaderboard',
      category: 'ACHIEVEMENT',
      rarity: 'EPIC',
      pointsValue: 750,
      isEarned: true,
      earnedAt: '2024-01-20T15:30:00Z',
      isFeatured: true,
      verificationRequestId: 'vr2'
    }
  ];

  const mockAvailableBadges: BadgeData[] = [
    {
      id: 'b1',
      name: 'Security Guardian',
      description: 'Verified expertise in application security',
      category: 'SECURITY',
      rarity: 'EPIC',
      pointsValue: 1000,
      progress: 45
    },
    {
      id: 'b2',
      name: 'AI Pioneer',
      description: 'Verified expertise in artificial intelligence',
      category: 'TECHNICAL',
      rarity: 'LEGENDARY',
      pointsValue: 1500,
      progress: 60
    },
    {
      id: 'b3',
      name: 'Open Source Hero',
      description: 'Significant contributions to open source projects',
      category: 'COMMUNITY',
      rarity: 'RARE',
      pointsValue: 400,
      progress: 95
    }
  ];

  const earnedCount = mockUserBadges.filter(b => b.isEarned).length;
  const totalPoints = mockUserBadges.reduce((sum, badge) => sum + badge.pointsValue, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="text-center space-y-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Achievements & Verification</h2>
          <p className="text-muted-foreground">Showcase your verified skills and accomplishments</p>
        </div>
        
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{earnedCount}</p>
            <p className="text-sm text-muted-foreground">Badges Earned</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">#{mockUserBadges.find(b => b.name === 'High Performer') ? '87' : '245'}</p>
            <p className="text-sm text-muted-foreground">Global Rank</p>
          </div>
        </div>
      </div>

      {/* Featured Badges */}
      {mockUserBadges.some(b => b.isFeatured) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Featured Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockUserBadges.filter(b => b.isFeatured).map((badge) => (
                <BadgeCard key={badge.id} badge={badge} size="large" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="earned" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earned">
            Earned ({earnedCount})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({mockAvailableBadges.length})
          </TabsTrigger>
          <TabsTrigger value="verification">
            Get Verified
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="space-y-4">
          {mockUserBadges.length > 0 ? (
            <BadgeGrid badges={mockUserBadges} />
          ) : (
            <div className="text-center py-12">
              <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No badges earned yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by improving your code quality and getting verified
              </p>
              <Button onClick={() => document.querySelector('[data-state="active"][value="verification"]')?.click()}>
                Get Your First Badge
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <BadgeGrid badges={mockAvailableBadges} showProgress />
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <VerificationCenter userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}