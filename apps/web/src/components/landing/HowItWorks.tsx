"use client"

import { motion } from "framer-motion"
import { ArrowDown } from "lucide-react"

const steps = [
  {
    title: "Import work",
    description: "Connect your GitHub, upload files, or paste project links",
    icon: "📁"
  },
  {
    title: "AI verifies",
    description: "Our AI analyzes and validates your actual contributions",
    icon: "🤖"
  },
  {
    title: "Share link",
    description: "Get a clean, recruiter-ready portfolio in seconds",
    icon: "🔗"
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your projects into proof
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-muted/30" />
            
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative flex items-start gap-6 mb-12 last:mb-0"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                {/* Step number circle */}
                <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-background border-2 border-muted/30 flex items-center justify-center text-2xl">
                  {step.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (except for last step) */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="absolute left-12 top-16 text-muted-foreground/30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p className="text-muted-foreground mb-4">
            Ready to showcase your real skills?
          </p>
          <motion.button
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get started now
            <ArrowDown className="h-4 w-4 rotate-[-90deg]" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
} 