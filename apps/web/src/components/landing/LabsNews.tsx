"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewsItem {
  source: string
  title: string
  url: string
  publishedAt: string
}

export function LabsNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    // Load news data
    const loadNews = async () => {
      try {
        const response = await fetch('/data/startup-news.json')
        const data = await response.json()
        setNews(data.slice(0, 3)) // Show only first 3 items
        setIsVisible(true)
      } catch (error) {
        console.error('Failed to load startup news:', error)
      }
    }

    loadNews()
  }, [])

  if (!isVisible || news.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section
          className="py-8 bg-muted/10 border-y border-muted/20"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Startup Daily — beta
                  </h3>
                  <span className="text-xs text-muted-foreground/60 bg-muted/30 px-2 py-1 rounded">
                    BETA
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs h-8 px-3"
                  >
                    {isExpanded ? "Show less" : "Show startup news (beta)"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsVisible(false)}
                    className="text-xs h-8 w-8 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {news.map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-muted/30"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {item.source}
                            </span>
                            <span className="text-xs text-muted-foreground/60">
                              {new Date(item.publishedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.title}
                          </p>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
} 