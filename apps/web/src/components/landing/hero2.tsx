import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-linear-to-b from-background to-muted">
      <div className=" px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Go Beyond Theory: Build Real Projects, Gain Verifiable Skills.
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Connect with peers from top institutions like IITs, contribute to impactful projects, and create a
                portfolio that showcases your true capabilities.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <Link href="/profile/edit">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Your Portfolio
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Projects
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[500px] aspect-square">
              <div className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg opacity-20 blur-xl"></div>
              <div className="relative h-full w-full rounded-lg bg-muted flex items-center justify-center">
                <Image
                  src="/images/hero-image.png"
                  alt="0Unveiled platform visualization"
                  className="rounded-lg object-cover w-full h-full"
                  width={400}
                  height={400}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
