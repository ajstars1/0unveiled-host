import Link from 'next/link';
import { memo, useMemo } from 'react';
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

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
}

// Structured data for SEO
const LEADERBOARD_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Developer Leaderboard",
  "description": "Top developers ranked by portfolio scores and achievements",
  "numberOfItems": 0, // Will be set dynamically
  "itemListElement": [] as any[]
};

function LeaderboardTableComponent({ data }: LeaderboardTableProps) {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map((entry, index) => {
      const displayName = entry.user.firstName || entry.user.lastName
        ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim()
        : entry.user.username || 'Anonymous';

      const initials = entry.user.firstName && entry.user.lastName
        ? `${entry.user.firstName.charAt(0)}${entry.user.lastName.charAt(0)}`.toUpperCase()
        : entry.user.firstName
        ? entry.user.firstName.charAt(0).toUpperCase()
        : entry.user.username
        ? entry.user.username.charAt(0).toUpperCase()
        : '?';

      const scoreColor = entry.score >= 8000
        ? "text-accent font-bold"
        : "text-orange-600 font-medium";

      return {
        ...entry,
        displayName,
        initials,
        scoreColor,
        key: `${entry.user.id}-${entry.rank}-${index}`
      };
    });
  }, [data]);

  // Memoize rank icon function
  const getRankIcon = useMemo(() => (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" aria-label="1st place" />;
    if (rank === 2) return <Medal className="h-4 w-4 md:h-5 md:w-5 text-gray-400" aria-label="2nd place" />;
    if (rank === 3) return <Award className="h-4 w-4 md:h-5 md:w-5 text-amber-600" aria-label="3rd place" />;
    return null;
  }, []);

  // Memoize rank badge variant
  const getRankBadgeVariant = useMemo(() => (rank: number) => {
    if (rank <= 3) return 'default';
    if (rank <= 10) return 'secondary';
    return 'outline';
  }, []);

  // Generate structured data for SEO
  const structuredData = useMemo(() => {
    const schema = { ...LEADERBOARD_SCHEMA };
    schema.numberOfItems = processedData.length;
    schema.itemListElement = processedData.slice(0, 10).map((entry, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Person",
        "name": entry.displayName,
        "identifier": entry.user.username || entry.user.id,
        "additionalProperty": {
          "@type": "PropertyValue",
          "name": "rank",
          "value": entry.rank
        }
      }
    }));
    return schema;
  }, [processedData]);

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      <div
        className="space-y-2 md:space-y-3"
        role="list"
        aria-label="Developer leaderboard rankings"
      >
        {processedData.map((entry) => (
          <article
            key={entry.key}
            className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors duration-200"
            itemScope
            itemType="https://schema.org/Person"
          >
            {/* Rank */}
            <div className="flex items-center gap-2 min-w-0" role="presentation">
              {getRankIcon(entry.rank)}
              <Badge
                variant={getRankBadgeVariant(entry.rank)}
                className="w-6 h-6 md:w-8 md:h-6 justify-center text-xs md:text-sm flex-shrink-0"
                aria-label={`Rank ${entry.rank}`}
              >
                {entry.rank}
              </Badge>
            </div>

            {/* Avatar */}
            <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
              <AvatarImage
                src={entry.user.profilePicture || undefined}
                alt={`${entry.displayName} profile picture`}
                itemProp="image"
              />
              <AvatarFallback className="text-xs md:text-sm" itemProp="name">
                {entry.initials}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={`/${entry.user.username || entry.user.id}`}
                className="font-medium hover:underline text-sm md:text-base truncate block"
                itemProp="url"
                aria-label={`View ${entry.displayName}'s profile`}
              >
                <span itemProp="name">{entry.displayName}</span>
              </Link>
              {entry.user.username && (
                <Link
                  href={`/${entry.user.username}`}
                  className="text-xs md:text-sm text-muted-foreground hover:underline truncate block"
                  aria-label={`@${entry.user.username} profile`}
                >
                  @{entry.user.username}
                </Link>
              )}
            </div>

            {/* Score */}
            <div className="flex-shrink-0" itemProp="additionalProperty" itemScope itemType="https://schema.org/PropertyValue">
              <meta itemProp="name" content="score" />
              <span
                className={`font-bold text-sm md:text-lg ${entry.scoreColor}`}
                itemProp="value"
                aria-label={`Score: ${entry.score.toLocaleString()}`}
              >
                {entry.score.toLocaleString()}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const LeaderboardTable = memo(LeaderboardTableComponent);
