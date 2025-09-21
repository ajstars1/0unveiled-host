// import { Metadata } from "next";
// import { Header } from "@/components/landing/Header";
// import { Hero } from "@/components/landing/Hero";
// import { ValueStrips } from "@/components/landing/ValueStrips";
// import { ImpactSection } from "@/components/landing/ImpactSection";
// import { HowItWorks } from "@/components/landing/HowItWorks";
// import { SocialProof } from "@/components/landing/SocialProof";
// import { FinalCTA } from "@/components/landing/FinalCTA";
// import { Footer } from "@/components/landing/Footer";
// import { LabsNews } from "@/components/landing/LabsNews";

// export const metadata: Metadata = {
//   title: "0unveiled - Show your proof. Skip the fluff.",
//   description: "Turn projects into recruiter-ready proof in minutes. AI-verified proof of work with zero fluff.",
//   keywords: ["portfolio", "recruiter", "proof of work", "AI verification", "career"],
//   openGraph: {
//     title: "0unveiled - Show your proof. Skip the fluff.",
//     description: "Turn projects into recruiter-ready proof in minutes.",
//     type: "website",
//     url: "https://0unveiled.com",
//   },
//   twitter: {
//     card: "summary_large_image",
//     title: "0unveiled - Show your proof. Skip the fluff.",
//     description: "Turn projects into recruiter-ready proof in minutes.",
//   },
// };

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-background">
//       <Header />
//       <main>
//         <Hero />
//         <ValueStrips />
//         <ImpactSection />
//         <HowItWorks />
//         <SocialProof />
//         <LabsNews />
//         <FinalCTA />
//       </main>
//       <Footer />
//     </div>
//   );
// }

// import { Hero } from "@/components/landingv2/Hero";
// import { ValueStrips } from "@/components/landingv2/ValueStrips";
// import { ImpactSection } from "@/components/landingv2/ImpactSection";
// import { HowItWorks } from "@/components/landingv2/HowItWorks";
// import { SocialProof } from "@/components/landingv2/SocialProof";
// import { LabsNews } from "@/components/landingv2/LabsNews";
// import { FinalCTA } from "@/components/landingv2/FinalCTA";
// import { Footer } from "@/components/landingv2/Footer";
// import { FloatingNav } from "@/components/landingv2/FloatingNav";

// const Index = () => {
//   return (
//     <div className="min-h-screen bg-background">
     
//       <main>
//         <Hero />
//         <ValueStrips />
//         <ImpactSection />
//         <HowItWorks />
//         <SocialProof />
//         <LabsNews />
//         <FinalCTA />
//       </main>
//       <Footer />
//     </div>
//   );
// };

// export default Index;


import { Toaster } from "sonner"
import Navbar from "@/components/landingv3/Navbar"
import Hero from "@/components/landingv3/Hero"
import HowItWorksScroller from "@/components/landingv3/HowItWorksScroller"
import LeaderboardTeaser from "@/components/landingv3/LeaderboardTeaser"
import RecruitmentToolsDemo from "@/components/landingv3/RecruitmentToolsDemo"
import TrustGalaxy from "@/components/landingv3/TrustGalaxy"
import SignUpCTA from "@/components/landingv3/SignUpCTA"
import Footer from "@/components/landingv3/Footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      /> */}
      
      {/* <Navbar /> */}
      
      <Hero />
      
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <HowItWorksScroller />
        </div>
      </section>
      
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <LeaderboardTeaser />
        </div>
      </section>
      
      <section className="py-16 lg:py-24">
        <RecruitmentToolsDemo />
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