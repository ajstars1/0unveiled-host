import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Title and Description */}
      <div>
        <Skeleton className="h-7 w-48 mb-1" /> {/* Title */}
        <Skeleton className="h-4 w-64" /> {/* Description */}
      </div>

      {/* Separator */}
      <Separator className="my-4" />

      {/* Form Skeleton */}
      <div className="space-y-8">
        {/* Grid for Username and Email */}
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          {/* Username Field */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded" /> {/* Input */}
            <Skeleton className="h-4 w-4/5" /> {/* Description */}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-12" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded" /> {/* Input */}
            <Skeleton className="h-4 w-3/4" /> {/* Description */}
          </div>

          {/* Headline Field */}
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-5 w-16" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded" /> {/* Input */}
            <Skeleton className="h-4 w-4/5" /> {/* Description */}
          </div>

          {/* Skills Field */}
          <div className="space-y-2 md:col-span-2">
            <Skeleton className="h-5 w-12" /> {/* Label */}
            <Skeleton className="h-16 w-full rounded" /> {/* MultipleSelector approximation */}
          </div>
        </div>

        {/* Submit Button */}
        <Skeleton className="h-10 w-32 rounded" />
      </div>
    </div>
  )
}
