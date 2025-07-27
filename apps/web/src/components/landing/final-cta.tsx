import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FinalCTA() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className=" px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Build Your Future?</h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Sign up free and start showcasing your potential today.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <Link href="/register">
              <Button size="lg" className="w-full">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
