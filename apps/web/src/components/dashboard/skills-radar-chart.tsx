"use client"

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

// Import the skills type from DashboardData
import type { DashboardData } from "@/data/dashboard"

// Define the props interface
interface SkillsRadarChartProps {
  skills: DashboardData['skills']; // Use the type from DashboardData
}

// Define a generic chart config for the single skill data series
const chartConfig = {
  value: {
    label: "Skill",
    color: "hsl(var(--chart-1))", // Use a primary chart color
  },
} satisfies ChartConfig

export function SkillsRadarChart({ skills }: SkillsRadarChartProps) {

  // Transform skills data for the chart
  // Assign a fixed value (e.g., 80) to represent presence
  const chartData = skills?.map(skill => ({
    subject: skill.name, // Use skill name as the axis label
    value: skill.level ?? 80, // Use level if available, otherwise default to 80
    // Add fullMark if needed, represents the max value (e.g., 100)
    fullMark: 100, 
  })) || [];

  // Determine link - assumes username exists if skills exist (fetched together)
  // Fallback to general settings if needed, though unlikely if data exists
  const manageSkillsLink = "/settings"; // Simplified link for now

  return (
    <Card>
      <CardHeader className="items-center pb-2">
         <div className="flex w-full items-center justify-between">
           <div className="space-y-1">
             <CardTitle>Skills Overview</CardTitle>
             <CardDescription>Visual representation of your top skills.</CardDescription>
           </div>
           <Button variant="ghost" size="sm" asChild>
            {/* Update link to point to skill management section */}
            <Link href={manageSkillsLink}> 
               Manage Skills
               <ChevronRight className="ml-1 h-4 w-4" />
             </Link>
           </Button>
         </div>
      </CardHeader>
      <CardContent className="pb-0">
        {skills && skills.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <RadarChart
              data={chartData}
              margin={{ top: 10, right: 30, bottom: 10, left: 30 }} // Adjust margins
            >
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />} // Hide default label, show subject via PolarAngleAxis
              />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 10 }} // Adjust tick font size
              />
              <PolarGrid gridType="polygon" />
              <Radar
                dataKey="value" // Use the 'value' key we assigned
                fill="var(--color-value)" // Use color from chartConfig
                fillOpacity={0.6}
                stroke="var(--color-value)" // Use same color for stroke
              />
            </RadarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] w-full items-center justify-center text-center text-sm text-muted-foreground">
             {skills === null ? (
                <Skeleton className="h-[200px] w-[200px] rounded-full" />
             ) : (
                <p>No skills data available.<br /> Add skills to your profile!</p>
             )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm pt-4">
        {/* Footer can be simplified or show total skill count */}
        <div className="leading-none text-muted-foreground">
           {skills ? `${skills.length} skills shown.` : "Loading skills..."}
        </div>
      </CardFooter>
    </Card>
  )
}
