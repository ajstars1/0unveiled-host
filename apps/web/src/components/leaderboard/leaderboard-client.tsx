'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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

export function LeaderboardClient() {
  const [leaderboardType, setLeaderboardType] = useState('GENERAL');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const debouncedSearch = useDebounce(search, 300);

  const offset = (currentPage - 1) * itemsPerPage;

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', leaderboardType, category, debouncedSearch, offset],
    queryFn: () => fetchLeaderboardData(leaderboardType, category, debouncedSearch, offset, itemsPerPage),
  });

  const handleTypeChange = (type: string) => {
    setLeaderboardType(type);
    setCategory(undefined);
    setCurrentPage(1);
  };

  const handleCategoryChange = (newCategory: string | undefined) => {
    setCategory(newCategory);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setCurrentPage(1);
  };

  const hasNextPage = data && data.length === itemsPerPage;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="container mx-auto max-w-6xl px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Leaderboards
        </h1>
        <p className="mt-3 text-base md:text-lg text-muted-foreground">
          Explore top builders across stacks and domains — powered by CRUISM scores
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
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
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              <Skeleton className="h-9 w-40" />
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Failed to load leaderboards</AlertTitle>
          <AlertDescription>
            An error occurred while fetching data. Please adjust filters or try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state */}
      {data && data.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <h3 className="text-lg font-medium">No results</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try changing the leaderboard type, category, or search query.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table + Pagination */}
      {data && data.length > 0 && (
        <Card>
          <CardContent className="p-0 overflow-hidden">
            <LeaderboardTable data={data} />
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-4 p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} · {data.length} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
