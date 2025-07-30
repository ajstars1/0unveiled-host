import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export const ProjectCardSkeleton = () => (
  <Card className="flex flex-col overflow-hidden h-full">
    <CardHeader className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" /> 
        <Skeleton className="h-4 w-1/2" /> 
    </CardHeader>
    <CardContent className="p-4 pt-0 grow space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="pt-2">
        <Skeleton className="h-3 w-16 mb-2" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </CardContent>
    <CardFooter className="p-4 pt-2">
      <Skeleton className="h-9 w-full" />
    </CardFooter>
  </Card>
) 