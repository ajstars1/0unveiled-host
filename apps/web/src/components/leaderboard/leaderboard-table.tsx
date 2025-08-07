import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function LeaderboardTable({ data }: { data: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry) => (
          <TableRow key={entry.user.id}>
            <TableCell>{entry.rank}</TableCell>
            <TableCell>{entry.user.firstName} {entry.user.lastName}</TableCell>
            <TableCell>{entry.score}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
