"use client"

import { ErrorContent } from "@/components/global/error"
import { useEffect } from "react"

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Error",
  description: "Something went wrong",
  robots: "noindex, nofollow",
}
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-secondary flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <ErrorContent reset={reset} />
      </div>
    </div>
  )
}
