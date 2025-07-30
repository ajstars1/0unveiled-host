"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

const testimonials = [
  {
    quote: "Game-changing verification system. Recruiters trust it instantly.",
    author: "Sarah Chen",
    role: "Senior Developer",
  },
  {
    quote: "Finally, a portfolio that speaks to technical depth and authenticity.",
    author: "Marcus Rodriguez",
    role: "Engineering Manager",
  },
  {
    quote: "Cut my hiring process time by 60%. The verification is bulletproof.",
    author: "Alex Thompson",
    role: "Tech Recruiter",
  },
];

export function SocialProof() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Trusted by professionals
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Developers and recruiters worldwide rely on verified portfolios.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 hover-lift">
                <blockquote className="text-sm mb-4 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center space-x-3">
                  {/* Simple avatar placeholder */}
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}