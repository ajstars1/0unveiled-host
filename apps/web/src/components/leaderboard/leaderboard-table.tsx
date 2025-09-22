import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  score: number;
  user: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
  };
}

export function LeaderboardTable({ data }: { data: LeaderboardEntry[] }) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank <= 3) return 'default';
    if (rank <= 10) return 'secondary';
    return 'outline';
  };

  const getInitials = (firstName: string | null, lastName: string | null, username: string | null) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getDisplayName = (user: LeaderboardEntry['user']) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.username || 'Anonymous';
  };

  const getScoreColor = (score: number) => {
    // Use theme colors for better psychological impact
    if (score >= 8000) return "text-accent font-bold"; // Success - accent color
    return "text-orange-600 font-medium"; // Needs improvement - warm orange instead of harsh red
  };

  return (
    <div className="space-y-2 md:space-y-3">
      {data.map((entry, index) => (
        <div
          key={`${entry.user.id}-${entry.rank}-${index}`}
          className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          {/* Rank */}
          <div className="flex items-center gap-2 min-w-0">
            {getRankIcon(entry.rank)}
            <Badge
              variant={getRankBadgeVariant(entry.rank)}
              className="w-6 h-6 md:w-8 md:h-6 justify-center text-xs md:text-sm flex-shrink-0"
            >
              {entry.rank}
            </Badge>
          </div>

          {/* Avatar */}
          <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
            <AvatarImage
              src={entry.user.profilePicture || undefined}
              alt={getDisplayName(entry.user)}
            />
            <AvatarFallback className="text-xs md:text-sm">
              {getInitials(entry.user.firstName, entry.user.lastName, entry.user.username)}
            </AvatarFallback>
          </Avatar>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/${entry.user.username || entry.user.id}`}
              className="font-medium hover:underline text-sm md:text-base truncate block"
            >
              {getDisplayName(entry.user)}
            </Link>
            {entry.user.username && (
              <Link
                href={`/${entry.user.username}`}
                className="text-xs md:text-sm text-muted-foreground hover:underline truncate block"
              >
                @{entry.user.username}
              </Link>
            )}
          </div>

          {/* Score */}
          <div className="flex-shrink-0">
            <span className={`font-bold text-sm md:text-lg ${getScoreColor(entry.score)}`}>
              {entry.score.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
