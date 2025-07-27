import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Search } from "lucide-react"
import React from "react"
import Image from "next/image"
// Define the data array
const audienceData = [
  {
    icon: <GraduationCap className="h-8 w-8" />,
    title: "For Students",
    subTitle: "Accelerate Your Career Journey",
    listItems: [
      "Gain competitive advantages in the job market",
      "Apply theoretical knowledge to real-world problems",
      "Network with future leaders in tech",
      "Build confidence & credibility through verified work",
    ],
    image: "student.jpeg", // Added image property
    altText: "Student using the platform",
  },
  {
    icon: <Search className="h-8 w-8" />,
    title: "For Recruiters & Project Leaders",
    subTitle: "Discover Proven Talent",
    listItems: [
      "Access a pool of skilled and motivated students",
      "Verify skills through documented project work",
      "Find collaborators for your initiatives",
      "See practical application of theoretical knowledge",
    ],
    image: "recruiter.jpeg", // Added image property
    altText: "Recruiter finding talent",
  },
]

export default function TargetAudience() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className=" px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Who is 0Unveiled For?</h2>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Our platform serves both ambitious students and recruiters looking for proven talent.
          </p>
        </div>

        {/* Map over the data array */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {audienceData.map((audience, index) => (
            <Card key={index} className="border-2 border-muted">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="rounded-full bg-primary/10 p-2 text-primary">
                  {audience.icon}
                </div>
                <CardTitle>{audience.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg font-medium mb-4">{audience.subTitle}</CardDescription>
                <ul className="space-y-2 text-left">
                  {audience.listItems.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {/* Added image container */}
                <div className="mt-6 bg-muted rounded-lg overflow-hidden aspect-video">
                  <Image
                    src={`/images/audience/${audience.image}`} // Assuming images are in public/images/audience
                    alt={audience.altText}
                    className="w-full h-full object-cover"
                    width={500}
                    height={500}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
