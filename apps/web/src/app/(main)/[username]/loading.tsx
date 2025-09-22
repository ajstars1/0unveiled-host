import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Loading Profile...",
  robots: "noindex, nofollow",
}
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <div className="relative py-20 lg:py-24">
        <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full bg-muted/50" />
              <div className="flex flex-col gap-3 flex-1">
                <Skeleton className="w-64 h-8 bg-muted/50" />
                <Skeleton className="w-48 h-5 bg-muted/50" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="w-16 h-6 rounded-full bg-muted/50" />
                  <Skeleton className="w-20 h-6 rounded-full bg-muted/50" />
                  <Skeleton className="w-14 h-6 rounded-full bg-muted/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="w-full h-64 rounded-lg bg-muted/50" />
              <Skeleton className="w-full h-48 rounded-lg bg-muted/50" />
              <Skeleton className="w-full h-56 rounded-lg bg-muted/50" />
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="w-full h-96 rounded-lg bg-muted/50" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="w-full h-48 rounded-lg bg-muted/50" />
                <Skeleton className="w-full h-48 rounded-lg bg-muted/50" />
              </div>
              <Skeleton className="w-full h-64 rounded-lg bg-muted/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
