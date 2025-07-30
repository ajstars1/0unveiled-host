"use client";

import { motion } from "framer-motion";

const benefits = [
  "AI-verified proof of work",
  "Recruiter-ready summaries",
  "Zero fluff portfolios",
  "Instant credibility checks",
  "Professional project showcase",
  "Skills verification system",
  "One-click sharing",
  "No manual formatting",
];

export function ValueStrips() {
  return (
    <section className="py-16 border-y border-border/50 bg-foreground overflow-hidden">
      <div className="relative">
        {/* First strip - left to right */}
        <motion.div
          animate={{ x: ["-100%", "0%"] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex whitespace-nowrap space-x-8 mb-8"
        >
          {[...benefits, ...benefits].map((benefit, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 text-sm text-muted"
            >
              <div className="w-1 h-1 bg-muted rounded-full" />
              <span>{benefit}</span>
            </div>
          ))}
        </motion.div>

        {/* Second strip - right to left */}
        <motion.div
          animate={{ x: ["0%", "-100%"] }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="flex whitespace-nowrap space-x-8"
        >
          {[...benefits.slice().reverse(), ...benefits.slice().reverse()].map(
            (benefit, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm text-muted"
              >
                <div className="w-1 h-1 bg-muted rounded-full" />
                <span>{benefit}</span>
              </div>
            )
          )}
        </motion.div>
      </div>
    </section>
  );
}