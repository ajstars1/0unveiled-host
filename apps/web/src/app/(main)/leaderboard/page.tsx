import { LeaderboardClient } from '@/components/leaderboard/leaderboard-client'
import TrustGalaxy from '@/components/landingv3/TrustGalaxy'
// import SignUpCTA from '@/components/landingv3/SignUpCTA'
import Footer from '@/components/landingv3/Footer'

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="py-16 lg:py-24">
        <LeaderboardClient />
      </section>

      <TrustGalaxy />

      {/* <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-2xl">
          <SignUpCTA />
        </div>
      </section> */}
      <Footer />
    </main>
  )
}
