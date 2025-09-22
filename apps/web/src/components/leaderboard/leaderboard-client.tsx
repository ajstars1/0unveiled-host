'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, memo, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { LeaderboardTable } from './leaderboard-table';
import { LeaderboardFilters } from './leaderboard-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const fetchLeaderboardData = async (
  type: string,
  category?: string,
  search?: string,
  offset: number = 0,
  limit: number = 20
) => {
  const params = new URLSearchParams({ type, limit: limit.toString(), offset: offset.toString() });

  if (category) {
    if (type === 'TECH_STACK') params.set('techStack', category);
    if (type === 'DOMAIN') params.set('domain', category);
  }

  if (search && search.trim()) {
    params.set('search', search.trim());
  }

  const response = await fetch(`/api/leaderboard?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard data');
  }
  const data = await response.json();
  return data.data;
};

function LeaderboardClientComponent() {
  const [leaderboardType, setLeaderboardType] = useState('GENERAL');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const debouncedSearch = useDebounce(search, 300);

  // Memoize offset calculation
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);

  // Memoize query key for better caching
  const queryKey = useMemo(() => [
    'leaderboard',
    leaderboardType,
    category,
    debouncedSearch,
    offset
  ], [leaderboardType, category, debouncedSearch, offset]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => fetchLeaderboardData(leaderboardType, category, debouncedSearch, offset, itemsPerPage),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoize event handlers
  const handleTypeChange = useCallback((type: string) => {
    setLeaderboardType(type);
    setCategory(undefined);
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((newCategory: string | undefined) => {
    setCategory(newCategory);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  }, []);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => prev - 1);
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Memoize pagination state
  const paginationState = useMemo(() => {
    const hasNextPage = data && data.length === itemsPerPage;
    const hasPrevPage = currentPage > 1;
    return { hasNextPage, hasPrevPage };
  }, [data, itemsPerPage, currentPage]);

  // Generate structured data for SEO
  const structuredData = useMemo(() => {
    if (!data || data.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Developer Leaderboard",
      "description": "Top developers ranked by portfolio scores and achievements",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Developer Rankings",
        "numberOfItems": data.length,
        "itemListElement": data.slice(0, 10).map((entry: any, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Person",
            "name": entry.user.firstName || entry.user.lastName
              ? `${entry.user.firstName || ''} ${entry.user.lastName || ''}`.trim()
              : entry.user.username || 'Anonymous',
            "identifier": entry.user.username || entry.user.id
          }
        }))
      }
    };
  }, [data]);

  return (
    <>
      {/* Structured Data for SEO */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}

      <div
        className="max-w-4xl mx-auto px-4 py-6 md:py-8"
        itemScope
        itemType="https://schema.org/WebPage"
      >
        {/* Header */}
        <header className="text-center mb-6 md:mb-8">
          <h1
            className="text-2xl sm:text-3xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text md:text-4xl font-bold tracking-tight text-transparent"
            itemProp="name"
          >
            Leaderboards
          </h1>
          <p
            className="mt-2 md:mt-3 text-sm md:text-base text-muted-foreground max-w-2xl mx-auto"
            itemProp="description"
          >
            Discover top developers and their achievements
          </p>
        </header>

        {/* Filters */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <LeaderboardFilters
              leaderboardType={leaderboardType}
              setLeaderboardType={handleTypeChange}
              setCategory={handleCategoryChange}
              search={search}
              setSearch={handleSearchChange}
            />
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading && (
          <div
            className="space-y-3 md:space-y-4"
            role="status"
            aria-label="Loading leaderboard data"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-muted rounded animate-pulse" />
                <div className="w-8 h-8 md:w-10 md:h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-1 md:space-y-2">
                  <div className="h-3 md:h-4 bg-muted rounded animate-pulse w-1/3" />
                  <div className="h-2 md:h-3 bg-muted rounded animate-pulse w-1/4" />
                </div>
                <div className="h-4 md:h-6 bg-muted rounded animate-pulse w-12 md:w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-8 md:py-12" role="alert">
            <p className="text-muted-foreground mb-4 text-sm md:text-base">
              Failed to load leaderboard data
            </p>
            <Button
              variant="outline"
              onClick={handleRetry}
              size="sm"
              className="text-sm"
              aria-label="Retry loading leaderboard data"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {data && data.length === 0 && !isLoading && (
          <div className="text-center py-8 md:py-12" role="status">
            <p className="text-muted-foreground text-sm md:text-base">No results found</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}

        {/* Results */}
        {data && data.length > 0 && (
          <div className="space-y-1">
            <LeaderboardTable data={data} />

            {/* Pagination */}
            {(paginationState.hasNextPage || paginationState.hasPrevPage) && (
              <nav
                className="flex items-center justify-between pt-4 md:pt-6 mt-6 md:mt-8 border-t"
                aria-label="Leaderboard pagination"
              >
                <p className="text-xs md:text-sm text-muted-foreground">
                  Page {currentPage}
                </p>
                <div className="flex gap-1 md:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={!paginationState.hasPrevPage}
                    className="text-xs md:text-sm px-2 md:px-3 h-8 md:h-9"
                    aria-label="Go to previous page"
                  >
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!paginationState.hasNextPage}
                    className="text-xs md:text-sm px-2 md:px-3 h-8 md:h-9"
                    aria-label="Go to next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4 ml-1" />
                  </Button>
                </div>
              </nav>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const LeaderboardClient = memo(LeaderboardClientComponent);
