"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";

interface NewsItem {
  source: string;
  title: string;
  url: string;
  publishedAt: string;
}

export function LabsNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isToggleVisible, setIsToggleVisible] = useState(true);

  useEffect(() => {
    // Load news data (using fallback for now, can be replaced with real API)
    const loadNews = async () => {
      try {
        // In production, this would be an API call: /api/startup-news
        // For now, using static fallback data
        const fallbackData = [
          {
            source: "TechCrunch",
            title: "AI verification startup raises $12M Series A",
            url: "https://techcrunch.com/ai-verification-startup",
            publishedAt: "2024-01-15T08:30:00Z"
          },
          {
            source: "VentureBeat", 
            title: "The future of developer portfolio authentication",
            url: "https://venturebeat.com/developer-portfolio-auth",
            publishedAt: "2024-01-14T14:20:00Z"
          },
          {
            source: "The Verge",
            title: "How AI is reshaping tech hiring processes", 
            url: "https://theverge.com/ai-tech-hiring",
            publishedAt: "2024-01-13T11:45:00Z"
          }
        ];
        setNews(fallbackData);
      } catch (error) {
        console.log('News feed unavailable:', error);
        setNews([]);
      }
    };

    loadNews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isToggleVisible) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 lg:px-6">
        {/* Toggle button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(!isVisible)}
            className="text-muted-foreground hover:text-foreground"
          >
            Show startup news (beta)
          </Button>
        </motion.div>

        {/* News widget */}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 bg-muted/20 border-muted max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Startup Daily — beta
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsToggleVisible(false)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {news.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group"
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start justify-between p-2 -m-2 rounded hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground group-hover:text-foreground/80 line-clamp-2 pr-2">
                            {item.title}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {item.source}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.publishedAt)}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </motion.div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4 italic">
                  Note: Real RSS/API integration can be added in production.
                </p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}