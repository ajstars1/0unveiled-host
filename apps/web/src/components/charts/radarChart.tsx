"use client"

import { TrendingUp } from "lucide-react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]


export function Component() {
  return (
    <Card className="bg-black/96 text-slate-300 p-0 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
      <CardHeader className="items-center pb-4">
        <CardTitle className="sr-only">Radar Chart - Multiple</CardTitle>
        <CardDescription className="sr-only">
          Showing total visitors for the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={{}}
          id="radar-chart"
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={chartData} className="mx-auto aspect-square max-h-[250px]"  >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" active={false} payload={[]} className="" label="" labelFormatter={undefined} labelClassName={undefined} formatter={undefined} color={undefined} nameKey={undefined} labelKey={undefined} />}
            />
            <PolarAngleAxis dataKey="month" />
            <PolarGrid />
            <Radar
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.6}
            />
            <Radar dataKey="mobile" fill="var(--color-mobile)" />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          January - June 2024
        </div>
      </CardFooter>
    </Card>
  )
}
