import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "0Unveiled helped me transform my theoretical knowledge into practical skills. I landed my dream internship after showcasing the projects I contributed to on the platform.",
      name: "Ayush J.",
      role: "IIT Kharagpur",
      avatar: "AJ",
    },
    {
      quote:
        "As a recruiter, I've found exceptional talent through 0Unveiled. The verifiable project contributions give me confidence in candidates' abilities beyond what a resume can show.",
      name: "Priya M.",
      role: "Tech Recruiter",
      avatar: "PM",
    },
    {
      quote:
        "Collaborating with peers from different institutions broadened my perspective and improved my teamwork skills. The portfolio I built on 0Unveiled was crucial in my job interviews.",
      name: "Rahul S.",
      role: "IIT Delhi",
      avatar: "RS",
    },
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30">
      <div className=" px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Hear From Our Community</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Don&apos;t just take our word for it. See what our users have to say about their experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="text-left">
                <CardContent className="pt-6">
                  <p className="mb-4 italic">&quot;{testimonial.quote}&quot;</p>
                </CardContent>
                <CardFooter>
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                      <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
