import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Award, Users, Briefcase } from "lucide-react"
import Image from "next/image"

export default function Features() {
  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Find & Join Real-World Projects",
      description:
        "Gain practical experience tackling challenges beyond the classroom. Find projects matching your skills and interests.",
      image: "feature6.png",
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Showcase Verifiable Skills",
      description:
        "Go beyond listing skills. Prove your abilities through tangible contributions documented on your profile.",
      image: "feature3.png",
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Collaborate with Top Peers",
      description: "Network and learn from motivated students, including those from premier institutions like IITs.",
      image: "feature4.png",
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: "Build a Portfolio That Stands Out",
      description:
        "Automatically generate portfolio items from your project work, creating compelling proof for recruiters.",
      image: "feature1.png",
    },
  ]

  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className=" px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Everything You Need to Succeed
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Our platform provides all the tools you need to develop your skills and advance your career.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-muted">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                  <div className="mt-4 bg-muted rounded-lg overflow-hidden aspect-video">
                    <Image
                      width={600}
                      height={600}
                      src={`/images/features/${feature.image}`}
                      alt={feature.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
