"use client"

import { BookX } from "lucide-react"
import { motion } from "framer-motion"

export function NotFoundHeader() {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex justify-center">
        <BookX className="h-24 w-24 text-primary animate-pulse" />
      </div>

      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>

      <p className="text-muted-foreground max-w-md mx-auto">
        Oops! Looks like this learning path took an unexpected turn. Don&apos;t
        worry, there are plenty of other lessons to explore!
      </p>
    </motion.div>
  )
}
