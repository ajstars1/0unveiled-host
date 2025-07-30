import Hero from "@/components/landing/hero2"
import TrustBar from "@/components/landing/trust-bar"
import HowItWorks from "@/components/landing/how-it-works"
import Features from "@/components/landing/features"
import TargetAudience from "@/components/landing/target-audience"
import Testimonials from "@/components/landing/testimonials"
import FinalCTA from "@/components/landing/final-cta"
import Footer from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow">
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Features />
        <TargetAudience />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
