import { UserCircle, Search, Users, Briefcase } from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      icon: <UserCircle className="h-10 w-10" />,
      title: "Sign Up & Showcase Skills",
      description: "Create your profile and highlight your technical abilities.",
    },
    {
      icon: <Search className="h-10 w-10" />,
      title: "Discover Real Projects",
      description: "Find opportunities that match your skills and interests.",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Collaborate & Contribute",
      description: "Work with peers and apply your knowledge to real challenges.",
    },
    {
      icon: <Briefcase className="h-10 w-10" />,
      title: "Build Your Verifiable Portfolio",
      description: "Showcase your contributions and achievements to potential employers.",
    },
  ]

  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
      <div className=" px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Launch Your Tech Career in 4 Simple Steps
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Our platform makes it easy to gain experience, build skills, and showcase your abilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center space-y-2 p-4">
                <div className="rounded-full bg-primary/10 p-4 text-primary">{step.icon}</div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
