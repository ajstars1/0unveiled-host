import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
      <div className="min-h-screen bg-background">

        <div className="container max-w-5xl mx-auto py-8 px-4">
          {/* <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              // onClick={() => Router.push("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Create New Project
              </h1>
              <p className="text-muted-foreground mt-1">
                Bring your ideas to life
              </p>
            </div>
        </div> */}
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="w-[40px] h-[40px] rounded-full" />
            <div className="flex flex-col gap-3">
              <Skeleton className="w-[200px] h-[40px]" />
              <Skeleton className="w-[300px] h-[16px]" />
            </div>
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
