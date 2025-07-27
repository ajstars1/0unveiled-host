import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo/Heading */}
      <Skeleton className="h-8 w-48 mb-16" />

      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-xs">
        {/* Title */}
        <Skeleton className="h-7 w-24" />

        {/* Description text */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Form fields */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" /> {/* Email label */}
            <Skeleton className="h-10 w-full rounded" /> {/* Email input */}
          </div>

          <div className="space-y-2">
            <Skeleton className="h-5 w-24" /> {/* Password label */}
            <Skeleton className="h-10 w-full rounded" /> {/* Password input */}
          </div>

          {/* Sign in button */}
          <Skeleton className="h-11 w-full rounded" />

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <Skeleton className="w-full h-px" />
            </div>
            <div className="relative flex justify-center">
              <Skeleton className="h-4 w-32 bg-white" />
            </div>
          </div>

          {/* Google sign in button */}
          <Skeleton className="h-11 w-full rounded" />
        </div>
      </div>

      {/* Bottom navigation dots */}
      <div className="fixed bottom-6 flex gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
    </div>
  )
}
