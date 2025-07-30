import {
  ArrowRight,
  Code2,
  Users2,
  Trophy,
  Target,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore the powerful features of 0Unveiled. Project-based learning, skill verification, and collaborative community features.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features - 0Unveiled",
    description:
      "Explore the powerful features of 0Unveiled. Project-based learning, skill verification, and collaborative community features.",
    url: "https://0unveiled.com/features",
  },
}

// Rest of the imports and component code remains exactly the same
const features = [
  {
    icon: Code2,
    title: "Project-Based Learning",
    description: "Learn through hands-on experience with real-world projects",
    benefits: [
      "Work on production-grade projects",
      "Build a practical portfolio",
      "Learn industry best practices",
    ],
  },
  {
    icon: Users2,
    title: "Collaborative Environment",
    description: "Connect and grow with a community of like-minded individuals",
    benefits: [
      "Team-based project development",
      "Peer learning opportunities",
      "Mentor guidance",
    ],
  },
  {
    icon: Trophy,
    title: "Skill Verification",
    description: "Get your skills validated through practical demonstrations",
    benefits: [
      "Earn skill badges",
      "Receive peer endorsements",
      "Build credible profiles",
    ],
  },
  {
    icon: Target,
    title: "Career Development",
    description: "Transform your learning into career opportunities",
    benefits: [
      "Industry connections",
      "Job placement support",
      "Career guidance",
    ],
  },
]

const toolsAndFeatures = [
  {
    title: "Project Management",
    items: [
      "Task tracking and assignment",
      "Progress monitoring",
      "Team collaboration tools",
      "Version control integration",
    ],
  },
  {
    title: "Learning Resources",
    items: [
      "Interactive tutorials",
      "Documentation library",
      "Best practices guides",
      "Code review tools",
    ],
  },
  {
    title: "Community Features",
    items: [
      "Discussion forums",
      "Real-time chat",
      "Knowledge sharing",
      "Mentorship programs",
    ],
  },
]

function Features() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative border-b">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-primary/10" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-6">
              Everything You Need to Succeed
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover how 0Unveiled empowers you to showcase your skills,
              collaborate on projects, and advance your career.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">
                Start Your Journey
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Core Features
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Comprehensive Tools for Growth
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform provides everything you need to learn, collaborate,
              and succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tools & Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Powerful Tools at Your Fingertips
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage projects, learn, and collaborate
              effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {toolsAndFeatures.map((section, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      {/* <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Success Stories
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              From Learning to Achievement
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              See how others have succeeded with 0Unveiled
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://images.unsplash.com/photo-1599566150163-29194dcaad36" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">John Doe</h4>
                  <p className="text-sm text-muted-foreground">
                    Software Engineer
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;Through 0Unveiled, I built a strong portfolio and landed
                my dream job at a top tech company.&quot;
              </p>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330" />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">Jane Smith</h4>
                  <p className="text-sm text-muted-foreground">UX Designer</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;The collaborative environment helped me improve my skills
                and build a network of amazing professionals.&quot;
              </p>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7" />
                  <AvatarFallback>MJ</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">Mike Johnson</h4>
                  <p className="text-sm text-muted-foreground">
                    Project Manager
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &quot;0Unveiled&apos;s project-based approach gave me practical
                experience that traditional education couldn&apos;t
                provide.&quot;
              </p>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
              </div>
            </Card>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of others who are building their future with
              0Unveiled
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {/* <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  Contact Sales
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Features
