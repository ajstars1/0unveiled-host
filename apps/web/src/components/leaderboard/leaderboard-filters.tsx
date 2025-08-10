import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';

const fetchLeaderboardOptions = async () => {
  const response = await fetch('/api/leaderboard/options');
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard options');
  }
  const data = await response.json();
  return data.data;
};

interface LeaderboardFiltersProps {
  leaderboardType: string;
  setLeaderboardType: (type: string) => void;
  setCategory: (category: string | undefined) => void;
  search: string;
  setSearch: (search: string) => void;
}

export function LeaderboardFilters({
  leaderboardType,
  setLeaderboardType,
  setCategory,
  search,
  setSearch,
}: LeaderboardFiltersProps) {
  const { data: options, isLoading } = useQuery({
    queryKey: ['leaderboard-options'],
    queryFn: fetchLeaderboardOptions,
  });

  const handleTypeChange = (type: string) => {
    setLeaderboardType(type);
    setCategory(undefined); // Reset category when type changes
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex gap-4">
        <Select value={leaderboardType} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a leaderboard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GENERAL">General</SelectItem>
            <SelectItem value="TECH_STACK">Tech Stack</SelectItem>
            <SelectItem value="DOMAIN">Domain</SelectItem>
          </SelectContent>
        </Select>

        {leaderboardType === 'TECH_STACK' && (
          <Select onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a tech stack" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                options?.techStacks?.map((techStack: string) => (
                  <SelectItem key={techStack} value={techStack}>
                    {techStack}
                  </SelectItem>
                )) || []
              )}
            </SelectContent>
          </Select>
        )}

        {leaderboardType === 'DOMAIN' && (
          <Select onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a domain" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                options?.domains?.map((domain: string) => (
                  <SelectItem key={domain} value={domain}>
                    {domain.replace('_', '/').replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
                )) || []
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="w-full max-w-sm">
        <Input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>
    </div>
  );
}
