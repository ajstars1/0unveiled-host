"use client"

import { Home, Search } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function NotFoundActions() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="flex flex-col sm:flex-row gap-4 justify-center items-center"
    >
      <Button
        variant="default"
        size="lg"
        asChild
        className="space-x-2 bg-primary hover:bg-primary/90"
      >
        <Link href="/">
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </Button>

      <Button variant="outline" size="lg" asChild className="space-x-2">
        <Link href="/projects">
          <Search className="w-4 h-4" />
          <span>Browse Projects</span>
        </Link>
      </Button>
    </motion.div>
  )
}
