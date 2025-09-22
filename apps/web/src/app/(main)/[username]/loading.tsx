import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Loading Profile...",
  robots: "noindex, nofollow", // Don't index loading states
  other: {
    "robots": "noindex,nofollow,noarchive,nosnippet,nocache"
  }
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Optimized background gradient - minimal impact */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 pointer-events-none" />

      <div className="relative py-20 lg:py-24">
        <div className="container mx-auto px-4 relative z-10 -mt-16 md:-mt-20">
          {/* Header Skeleton - Optimized for perceived performance */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full bg-muted/30" />
              <div className="flex flex-col gap-3 flex-1">
                <Skeleton className="w-64 h-8 bg-muted/30" />
                <Skeleton className="w-48 h-5 bg-muted/30" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="w-16 h-6 rounded-full bg-muted/30" />
                  <Skeleton className="w-20 h-6 rounded-full bg-muted/30" />
                  <Skeleton className="w-14 h-6 rounded-full bg-muted/30" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Skeleton - Staggered loading animation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <Skeleton className="w-full h-64 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '0ms' }} />
              <Skeleton className="w-full h-48 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '100ms' }} />
              <Skeleton className="w-full h-56 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="w-full h-96 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '300ms' }} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="w-full h-48 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '400ms' }} />
                <Skeleton className="w-full h-48 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '500ms' }} />
              </div>
              <Skeleton className="w-full h-64 rounded-lg bg-muted/30 animate-pulse" style={{ animationDelay: '600ms' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
