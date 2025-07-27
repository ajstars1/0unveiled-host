import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface ErrorContentProps {
  reset: () => void
}

export function ErrorContent({ reset }: ErrorContentProps) {
  return (
    <>
      <div className="flex justify-center">
        <AlertTriangle className="h-24 w-24 text-destructive" />
      </div>
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
        Oops! Something went wrong
      </h1>
      <p className="max-w-2xl leading-normal text-muted-foreground sm:text-xl sm:leading-8">
        We apologize for the inconvenience. Our team has been notified and is
        working on fixing the issue.
      </p>
      <div className="flex justify-center gap-4">
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    </>
  )
}
