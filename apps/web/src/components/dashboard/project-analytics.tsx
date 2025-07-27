"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Sector,
  LabelList
} from "recharts"
import {
  ChartContainer,
  ChartTooltip as ShadcnChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig
} from "@/components/ui/chart"

interface ProjectAnalyticsProps {
  projectId: string
}

const activityData = {
  labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"],
  datasets: [
    { name: "Commits", data: [5, 10, 15, 8, 12, 18, 14, 20], color: "hsl(var(--chart-1))" },
    { name: "Tasks Completed", data: [3, 6, 9, 4, 7, 10, 8, 12], color: "hsl(var(--chart-2))" },
  ],
  chartData: Array.from({ length: 8 }, (_, i) => ({
    name: `Week ${i + 1}`,
    Commits: [5, 10, 15, 8, 12, 18, 14, 20][i],
    TasksCompleted: [3, 6, 9, 4, 7, 10, 8, 12][i],
  })),
}

const contributionData = {
  labels: ["John", "Sarah", "Michael", "Emily"],
  data: [35, 25, 20, 20],
  colors: ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"],
  chartData: [
    { name: "John", value: 35, fill: "hsl(var(--chart-1))" },
    { name: "Sarah", value: 25, fill: "hsl(var(--chart-2))" },
    { name: "Michael", value: 20, fill: "hsl(var(--chart-3))" },
    { name: "Emily", value: 20, fill: "hsl(var(--chart-4))" },
  ],
}

const taskCompletionData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [
    { name: "Planned", data: [5, 8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 40], color: "hsl(var(--chart-1))" },
    { name: "Completed", data: [5, 7, 10, 12, 14, 17, 19, 21, 23, 25, 27, 30], color: "hsl(var(--chart-2))" },
  ],
  chartData: Array.from({ length: 12 }, (_, i) => ({
    name: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    Planned: [5, 8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 40][i],
    Completed: [5, 7, 10, 12, 14, 17, 19, 21, 23, 25, 27, 30][i],
  })),
}

const activityChartConfig: ChartConfig = {
  Commits: {
    label: "Commits",
    color: activityData.datasets[0].color,
  },
  TasksCompleted: {
    label: "Tasks Completed",
    color: activityData.datasets[1].color,
  },
}

const contributionChartConfig: ChartConfig = contributionData.chartData.reduce((acc, cur) => {
  acc[cur.name] = { label: cur.name, color: cur.fill }
  return acc
}, {} as ChartConfig)

const taskCompletionChartConfig: ChartConfig = {
  Planned: {
    label: "Planned",
    color: taskCompletionData.datasets[0].color,
  },
  Completed: {
    label: "Completed",
    color: taskCompletionData.datasets[1].color,
  },
}

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Project Activity</CardTitle>
          <CardDescription>Commits and tasks completed over time.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
            <LineChart
              data={activityData.chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <ShadcnChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="Commits" stroke={activityChartConfig.Commits.color} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="TasksCompleted" stroke={activityChartConfig.TasksCompleted.color} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Contributions</CardTitle>
          <CardDescription>Distribution of contributions among team members.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={contributionChartConfig} className="h-[300px] w-full">
            <PieChart>
              <ShadcnChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
              <Pie
                data={contributionData.chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={50}
                paddingAngle={2}
              >
                {contributionData.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="name"
                  className="fill-background"
                  stroke="none"
                  fontSize={12}
                  formatter={(value: string) => contributionChartConfig[value]?.label}
                />
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Task Completion Over Time</CardTitle>
          <CardDescription>Planned vs. completed tasks per month.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={taskCompletionChartConfig} className="h-[300px] w-full">
            <BarChart data={taskCompletionData.chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <ShadcnChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="Planned" fill={taskCompletionChartConfig.Planned.color} radius={4} />
              <Bar dataKey="Completed" fill={taskCompletionChartConfig.Completed.color} radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
