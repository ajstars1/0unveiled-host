'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { LeaderboardTable } from './leaderboard-table';
import { LeaderboardFilters } from './leaderboard-filters';

const fetchLeaderboardData = async (type: string, category?: string) => {
  const params = new URLSearchParams({ type });
  if (category) {
    if (type === 'TECH_STACK') params.set('techStack', category);
    if (type === 'DOMAIN') params.set('domain', category);
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

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', leaderboardType, category],
    queryFn: () => fetchLeaderboardData(leaderboardType, category),
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Leaderboards</h1>
      <LeaderboardFilters 
        leaderboardType={leaderboardType}
        setLeaderboardType={setLeaderboardType}
        setCategory={setCategory}
      />
      {isLoading && <p>Loading...</p>}
      {error && <p>Error fetching data</p>}
      {data && <LeaderboardTable data={data} />}
    </div>
  );
}
