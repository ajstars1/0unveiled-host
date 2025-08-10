'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { LeaderboardTable } from './leaderboard-table';
import { LeaderboardFilters } from './leaderboard-filters';
import { Button } from '@/components/ui/button';
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
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Leaderboards</h1>
        <p className="text-muted-foreground">
          Discover top performers across different technologies and domains based on CRUISM scores
        </p>
      </div>
      
      <LeaderboardFilters
        leaderboardType={leaderboardType}
        setLeaderboardType={handleTypeChange}
        setCategory={handleCategoryChange}
        search={search}
        setSearch={handleSearchChange}
      />
      
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <p>Loading leaderboard data...</p>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center py-8">
          <p className="text-red-500">Error fetching data. Please try again.</p>
        </div>
      )}
      
      {data && data.length === 0 && (
        <div className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">No results found for the current filters.</p>
        </div>
      )}
      
      {data && data.length > 0 && (
        <>
          <LeaderboardTable data={data} />
          
          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <p className="text-sm text-muted-foreground">
              Showing page {currentPage} ({data.length} results)
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
