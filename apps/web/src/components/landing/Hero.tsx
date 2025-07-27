import Link from "next/link"
import { Spotlight } from "@/components/ui/Spotlight"
import { Button } from "@/components/ui/button"

const HeroSection = () => {
  return (
    <div className="h-screen md:h-160 w-full flex items-center justify-center bg-black/96 antialiased bg-grid-white/[0.02] relative overflow-hidden">
      <Spotlight className="top-0 left-6 md:left-60 md:-top-20" fill="white" />
      <div className=" p-4 max-w-7xl  mx-auto relative z-10 flex flex-col justify-center items-center w-full md:pt-0">
        <h1 className="text-4xl md:text-7xl font-bold text-center bg-clip-text text-transparent bg-linear-to-b from-neutral-50 to-neutral-400 bg-opacity-50">
          0Unveiled <br /> is the new trend.
        </h1>
        <p className="mt-4 font-normal text-base text-neutral-300 max-w-lg text-center mx-auto">
          Showcasing the Hidden Value of Zero. &quot;0Unveiled&quot; perfectly
          captures the core concept of showcasing hidden talent.
        </p>
        <Button className="mt-4 inline-flex h-12 animate-shimmer items-center justify-center rounded-md   bg-size-[200%_100%] px-6 font-medium text-slate-800 bg-linear-to-b from-neutral-50 to-neutral-400 hover:from-neutral-100 hover:to-neutral-400 hover:text-slate-900 bg-opacity-50 transition-colors ">
          <Link href={"/about"}>What is 0Unveiled?</Link>
        </Button>
      </div>
    </div>
  )
}

export default HeroSection
