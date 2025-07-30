"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-background overflow-hidden">
      {/* Ambient gradient background */}
      <div className="absolute inset-0 bg-grad-radial opacity-30 motion-safe:animate-drift" />
      <div className="absolute inset-0 bg-grad-linear opacity-20" />
      
      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Show your proof.{" "}
                <span className="text-muted-foreground">Skip the fluff.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Turn projects into recruiter-ready proof in minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="hover-lift group" variant="default">
                Create your portfolio
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg" className="hover-lift">
                View examples
              </Button>
            </div>
          </motion.div>

          {/* Right: Ambient visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[400px] lg:h-[500px]"
          >
            {/* Abstract geometric shapes with subtle motion */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 1, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-64 h-64 border border-muted rounded-3xl bg-foreground backdrop-blur-sm"
              />
              <motion.div
                animate={{
                  scale: [1, 0.95, 1],
                  rotate: [0, -1, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute w-48 h-48 border border-muted/50 rounded-2xl bg-muted/30 backdrop-blur-sm"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}