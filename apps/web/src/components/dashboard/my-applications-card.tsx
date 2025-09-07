'use client'

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// Need to import badgeVariants to use with VariantProps
import { Badge, badgeVariants } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"
import { Mail } from "lucide-react" // Icon for the card
import { formatDistanceToNow } from 'date-fns';

import type { DashboardData } from "@/data/dashboard"
import { applicationStatusEnum } from "@0unveiled/database"

// Derive the ApplicationStatus type from the enum
type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];

// Define the props interface
interface MyApplicationsCardProps {
  applications: DashboardData['applicationsSent'];
}

// Helper to map standard variants
const mapApplicationStatusVariant = (status: string): VariantProps<typeof badgeVariants>["variant"] => {
    switch (status) {
        case "ACCEPTED": return "default"; // Using default for success (green style later)
        case "REJECTED": return "destructive";
        case "PENDING": return "secondary"; // Using secondary for pending (yellow style later)
        case "WITHDRAWN": return "outline"; // Handle withdrawn status
        default: return "secondary";
    }
}

export function MyApplicationsCard({ applications }: MyApplicationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>My Sent Applications</CardTitle>
        </div>
        <CardDescription>Status of your recent project applications.</CardDescription>
      </CardHeader>
      <CardContent>
        {applications && applications.length > 0 ? (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30">
                <div className="grow space-y-0.5 overflow-hidden">
                  <p className="text-sm font-medium truncate">
                     Applied to:{" "}
                     <Link href={`/project/${app.project.id}`} className="hover:underline text-primary">
                         {app.project.title}
                     </Link>
                     {app.projectRole && (
                         <span className="text-muted-foreground"> for role: &quot;{app.projectRole.title}&quot;</span>
                     )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                     Submitted {formatDistanceToNow(new Date(app.submittedAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="shrink-0">
                   <Badge variant={mapApplicationStatusVariant(app.status)} className="capitalize">
                       {app.status.toLowerCase()}
                   </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[100px] flex-col items-center justify-center text-center text-sm text-muted-foreground border rounded-md">
             <Mail className="h-8 w-8 mb-2 text-muted-foreground/50" />
             <p>You haven&apos;t submitted any applications recently.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 