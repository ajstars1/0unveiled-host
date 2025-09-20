"use client";

import React, { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserProfileData, LeaderboardData } from "@/react-query/user";

interface OptimizedProfileHeaderProps {
  user: UserProfileData;
  fullName: string;
  isOwnProfile: boolean;
  username: string;
  leaderboardData?: LeaderboardData;
}

// Memoized leaderboard card component
const LeaderboardCard = memo(({ 
  userRank, 
  userScore 
}: { 
  userRank: number | null; 
  userScore: number | null; 
}) => {
  if (userRank === null && userScore === null) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {userRank !== null && (
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-muted-foreground">
                  Rank
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-foreground mr-1">
                    #{userRank}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary"
                  >
                    Global
                  </Badge>
                </div>
              </div>
            )}

            {userScore !== null && (
              <div className="space-y-0.5 mt-3">
                <div className="text-sm font-medium text-muted-foreground">
                  Score
                </div>
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-foreground">
                    {userScore}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    pts
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className={cn(
                "h-24 w-24 rounded-full flex items-center justify-center",
                "bg-gradient-to-br from-primary/10 to-secondary/10 border border-border"
              )}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {userScore !== null ? userScore : "-"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Points
                </div>
              </div>
            </div>
            {userRank !== null && userRank <= 10 && (
              <div className="absolute -top-4 -right-1 bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center text-xs font-semibold text-center">
                Top {userRank <= 3 ? userRank : 10}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Link href="/leaderboard" className="w-full">
            <Button variant="outline" size="sm" className="w-full">
              <span>View Full Leaderboard</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
});

LeaderboardCard.displayName = "LeaderboardCard";

// Memoized about card component
const AboutCard = memo(({ bio }: { bio: string }) => {
  if (!bio) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">About</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
          {bio}
        </p>
      </CardContent>
    </Card>
  );
});

AboutCard.displayName = "AboutCard";

// Main optimized profile header component
const OptimizedProfileHeader = memo<OptimizedProfileHeaderProps>(({
  user,
  fullName,
  isOwnProfile,
  username,
  leaderboardData,
}) => {
  // Memoize expensive computations
  const leaderboardInfo = useMemo(() => {
    if (!leaderboardData || 'error' in leaderboardData) {
      return { userRank: null, userScore: null };
    }
    
    return {
      userRank: leaderboardData.rank,
      userScore: leaderboardData.score,
    };
  }, [leaderboardData]);

  return (
    <div className="space-y-6">
      <LeaderboardCard 
        userRank={leaderboardInfo.userRank}
        userScore={leaderboardInfo.userScore}
      />
      
      <AboutCard bio={user?.bio || ""} />
    </div>
  );
});

OptimizedProfileHeader.displayName = "OptimizedProfileHeader";

export default OptimizedProfileHeader;
