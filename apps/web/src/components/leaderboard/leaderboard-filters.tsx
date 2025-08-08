import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function LeaderboardFilters({ leaderboardType, setLeaderboardType, setCategory }: { leaderboardType: string, setLeaderboardType: (type: string) => void, setCategory: (category: string | undefined) => void }) {
  return (
    <div className="flex gap-4 mb-4">
      <Select value={leaderboardType} onValueChange={setLeaderboardType}>
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
            {/* In a real app, these would be fetched from an API */}
            <SelectItem value="PYTHON">Python</SelectItem>
            <SelectItem value="TYPESCRIPT">TypeScript</SelectItem>
            <SelectItem value="GO">Go</SelectItem>
          </SelectContent>
        </Select>
      )}

      {leaderboardType === 'DOMAIN' && (
        <Select onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FRONTEND">Frontend</SelectItem>
            <SelectItem value="BACKEND">Backend</SelectItem>
            <SelectItem value="AI_ML">AI/ML</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
