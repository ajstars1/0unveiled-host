"use client"

import { Users, Briefcase, Inbox, Mail, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Import the metrics type from DashboardData
import type { DashboardData } from "@/data/dashboard"

// Define the props interface
interface MetricsCardsProps {
  metrics: DashboardData['metrics'];
}

export function MetricsCards({ metrics }: MetricsCardsProps) {

  // Handle potential loading state if metrics object isn't fully populated (though parent should handle null)
  const isLoading = !metrics;

  const metricData = [
    {
      title: "Connections",
      value: metrics?.connectionCount,
      icon: Users,
      description: "Your professional network size."
    },
    {
      title: "Active Projects",
      value: metrics?.activeProjectCount,
      icon: Briefcase,
      description: "Projects you are currently involved in."
    },
    {
      title: "Pending Apps Sent",
      value: metrics?.pendingApplicationsSentCount,
      icon: Mail,
      description: "Applications you've submitted awaiting review."
    },
    {
      title: "Pending Requests",
      value: metrics?.pendingConnectionRequestCount,
      icon: UserPlus,
      description: "Incoming connection requests to review."
    },
     // Example: Add Received Apps if needed (adjust grid cols)
    // {
    //   title: "Pending Apps Received",
    //   value: metrics?.pendingApplicationsReceivedCount,
    //   icon: Inbox,
    //   description: "Applications for your projects awaiting review."
    // },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricData.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            {isLoading ? (
                <Skeleton className="h-4 w-4" />
            ) : (
                <metric.icon className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
             {isLoading ? (
                 <Skeleton className="h-8 w-1/2" />
             ) : (
                <div className="text-2xl font-bold">{metric.value?.toLocaleString() ?? '0'}</div>
             )}
            {/* Removed percentage change text */}
             <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
