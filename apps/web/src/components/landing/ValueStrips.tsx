"use client"

import { motion } from "framer-motion"
import { useRef, useEffect, useState } from "react"

const benefits = [
  "AI-verified proof of work",
  "Recruiter-ready summaries", 
  "Zero fluff",
  "Instant portfolio generation",
  "Real project validation",
  "Skills that speak for themselves"
]

export function ValueStrips() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <section className="py-16 overflow-hidden bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="flex gap-8"
          ref={containerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          animate={{
            x: isHovered ? 0 : [-100, 0]
          }}
          transition={{
            duration: isHovered ? 0 : 20,
            repeat: isHovered ? 0 : Infinity,
            ease: "linear"
          }}
        >
          {/* Duplicate the benefits for seamless loop */}
          {[...benefits, ...benefits].map((benefit, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 whitespace-nowrap"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-sm font-medium text-muted-foreground px-4 py-2 rounded-full border border-muted/30 bg-background/50 backdrop-blur-sm">
                {benefit}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
} 