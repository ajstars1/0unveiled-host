"use client"

import { HelpCircle, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function NotFoundSupport() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-center space-x-2 text-muted-foreground">
        <HelpCircle className="w-4 h-4" />
        <span>Need assistance?</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        asChild
        className="text-muted-foreground hover:text-primary"
      >
        <Link href="/support" className="flex items-center space-x-2">
          <Mail className="w-4 h-4" />
          <span>Contact Support</span>
        </Link>
      </Button>
    </motion.div>
  )
}
