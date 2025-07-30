import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="w-[40px] h-[40px] rounded-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="w-[200px] h-[40px]" />
              <Skeleton className="w-[300px] h-[16px]" />
            </div>
            {/* <Skeleton className="w-[80px] h-[24px] rounded-full" /> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <Skeleton className="w-full h-[40px]" />
            <Skeleton className="w-full h-[300px]" />
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-2">
            <Skeleton className="w-full h-[200px]" />
            <Skeleton className="w-full h-[200px]" />
          </div>
        </div>
      </div>
    </div>
  )
}
