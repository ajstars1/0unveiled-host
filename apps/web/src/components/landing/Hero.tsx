"use client"

import { motion } from "framer-motion"
import { Button } from "@0unveiled/ui/components/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Ambient gradient overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, hsl(0 0% 100% / 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, hsl(0 0% 100% / 0.05) 0%, transparent 50%),
            linear-gradient(135deg, hsl(0 0% 100% / 0.02) 0%, transparent 100%)
          `
        }}
        animate={{
          background: [
            `
              radial-gradient(circle at 20% 80%, hsl(0 0% 100% / 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(0 0% 100% / 0.05) 0%, transparent 50%),
              linear-gradient(135deg, hsl(0 0% 100% / 0.02) 0%, transparent 100%)
            `,
            `
              radial-gradient(circle at 25% 75%, hsl(0 0% 100% / 0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 25%, hsl(0 0% 100% / 0.05) 0%, transparent 50%),
              linear-gradient(135deg, hsl(0 0% 100% / 0.02) 0%, transparent 100%)
            `,
            `
              radial-gradient(circle at 20% 80%, hsl(0 0% 100% / 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, hsl(0 0% 100% / 0.05) 0%, transparent 50%),
              linear-gradient(135deg, hsl(0 0% 100% / 0.02) 0%, transparent 100%)
            `
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content stack */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Show your proof.
              <br />
              <span className="text-muted-foreground">Skip the fluff.</span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Turn projects into recruiter-ready proof in minutes.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button variant="default" size="lg" className="text-base h-12 px-8">
                Create your portfolio
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="text-base h-12 px-8">
                View examples
              </Button>
            </motion.div>
          </motion.div>

          {/* Right gradient canvas */}
          <motion.div
            className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 via-muted/10 to-background" />
            
            {/* Animated gradient elements */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-muted/30 to-transparent"
              animate={{
                x: [0, 10, 0],
                y: [0, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <motion.div
              className="absolute bottom-1/3 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-muted/20 to-transparent"
              animate={{
                x: [0, -15, 0],
                y: [0, 15, 0],
                scale: [1, 0.9, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
            
            <motion.div
              className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-muted/25 to-transparent"
              animate={{
                x: [0, 20, 0],
                y: [0, -20, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(hsl(0 0% 100% / 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, hsl(0 0% 100% / 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
