import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
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
    // Scores are now in 0-10000 range, so adjust thresholds accordingly
    if (score >= 8000) return 'text-green-600';
    if (score >= 6000) return 'text-blue-600';
    if (score >= 4000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Rank</TableHead>
            <TableHead>Developer</TableHead>
            <TableHead>Username</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow key={`${entry.user.id}-${entry.rank}-${index}`} className="hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <Badge variant={getRankBadgeVariant(entry.rank)} className="w-8 h-6 justify-center">
                    {entry.rank}
                  </Badge>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={entry.user.profilePicture || undefined} 
                      alt={getDisplayName(entry.user)}
                    />
                    <AvatarFallback>
                      {getInitials(entry.user.firstName, entry.user.lastName, entry.user.username)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col">
                    <Link 
                      href={`/${entry.user.username || entry.user.id}`}
                      className="font-medium hover:underline"
                    >
                      {getDisplayName(entry.user)}
                    </Link>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                {entry.user.username ? (
                  <Link 
                    href={`/${entry.user.username}`}
                    className="text-muted-foreground hover:underline"
                  >
                    @{entry.user.username}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">No username</span>
                )}
              </TableCell>
              
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className={`font-bold text-lg ${getScoreColor(entry.score)}`}>
                    {(entry.score)}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
