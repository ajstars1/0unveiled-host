"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Frontend Developer",
    company: "TechCorp",
    quote: "0unveiled helped me land my dream job. The AI verification gave recruiters confidence in my actual skills.",
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    role: "Full Stack Engineer",
    company: "StartupXYZ",
    quote: "Finally, a portfolio that shows what I can actually do, not just what I say I can do.",
    avatar: "MR"
  },
  {
    name: "Alex Kim",
    role: "DevOps Engineer",
    company: "CloudScale",
    quote: "The recruiter was impressed by the verified project details. Got the offer within a week.",
    avatar: "AK"
  }
]

export function SocialProof() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Trusted by developers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what others are saying about their experience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="bg-muted/20 rounded-lg p-6 border border-muted/30 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted/50 text-muted-foreground font-medium">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
                <blockquote className="text-sm text-muted-foreground leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { label: "Portfolios Created", value: "2,847" },
              { label: "Success Rate", value: "94%" },
              { label: "Avg. Time to Hire", value: "12 days" },
              { label: "Satisfaction Score", value: "4.9/5" }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
} 