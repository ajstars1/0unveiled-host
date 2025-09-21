"use client"

import { useState, useEffect, useRef, useCallback, useMemo, memo, Suspense } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Trophy, Star, ExternalLink, X } from "lucide-react"
import { toast } from "sonner"
import { useDeviceDetection } from "@/hooks/use-device-detection"

interface LeaderboardEntry {
  id: string
  name: string
  handle: string
  avatar: string
  role: string
  score: number
  rank: number
  projects: Array<{
    name: string
    score: number
    description: string
  }>
  skills: string[]
}

interface DetailPanelProps {
  entry: LeaderboardEntry
  onClose: () => void
}

const DetailPanel = memo(({ entry, onClose }: DetailPanelProps) => {
  // Structured data for SEO
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Person",
    "name": entry.name,
    "alternateName": entry.handle,
    "image": entry.avatar,
    "jobTitle": entry.role,
    "knowsAbout": entry.skills,
    "hasOccupation": {
      "@type": "Occupation",
      "name": entry.role,
      "occupationalCategory": entry.role
    }
  }), [entry])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle asChild>
            <h2 className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <Link href={`/${entry.handle}`} className="relative flex-shrink-0">
                <Avatar className={`h-12 w-12 sm:h-16 sm:w-16 ${entry.rank <= 3 ? 'ring-2 ring-accent shadow-lg' : ''} cursor-pointer hover:opacity-80 transition-opacity`}>
                  <AvatarImage src={entry.avatar} alt={`${entry.name} avatar`} />
                  <AvatarFallback>{entry.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                {entry.rank <= 3 && (
                  <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold">
                    {entry.rank}
                  </div>
                )}
              </Link>
              <Link href={`/${entry.handle}`} className="min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity">
                <h3 className="text-lg sm:text-xl font-heading font-semibold truncate">{entry.name}</h3>
                <p className="text-muted-foreground text-sm sm:text-base">@{entry.handle}</p>
                <Badge variant="secondary" className="mt-1 text-xs sm:text-sm whitespace-normal break-words max-w-full">{entry.role}</Badge>
              </Link>
            </h2>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <section>
            <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Score Breakdown
            </h4>
            <div className="bg-muted rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-primary">{entry.score.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Points</div>
            </div>
          </section>

          <section>
            <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Star className="h-4 w-4" aria-hidden="true" />
              Top Projects
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {entry.projects.map((project, index) => (
                <article key={`${entry.id}-project-${index}`} className="border rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <h5 className="font-medium text-sm sm:text-base">{project.name}</h5>
                    <Badge variant="outline" className="text-xs self-start sm:self-auto">{project.score.toLocaleString()} pts</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{project.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h4 className="font-semibold mb-2 text-sm sm:text-base">Skills</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {entry.skills.map((skill, index) => (
                <Badge key={`${entry.id}-skill-${index}`} variant="secondary" className="text-xs">{skill}</Badge>
              ))}
            </div>
          </section>

          <Button className="w-full text-sm sm:text-base" onClick={() => toast.info("Profile view coming soon!")}>
            <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
            View Full Profile
          </Button>
        </div>
      </DialogContent>
    </>
  )
})

DetailPanel.displayName = 'DetailPanel'

const AnimatedScore = memo(({ score, isTop3 }: { score: number; isTop3: boolean }) => {
  const [displayScore, setDisplayScore] = useState(score)
  const prevScore = useRef(score)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const shouldReduceMotion = prefersReducedMotion

  useEffect(() => {
    if (score !== prevScore.current && !shouldReduceMotion) {
      const diff = score - prevScore.current
      const duration = 500
      const steps = 20
      const increment = diff / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        const newScore = Math.round(prevScore.current + (increment * currentStep))
        setDisplayScore(newScore)

        if (currentStep >= steps) {
          clearInterval(interval)
          setDisplayScore(score)
          prevScore.current = score
        }
      }, duration / steps)

      return () => clearInterval(interval)
    } else {
      setDisplayScore(score)
      prevScore.current = score
    }
  }, [score, shouldReduceMotion])

  return (
    <span className={`font-bold tabular-nums ${isTop3 ? 'text-accent' : 'text-primary'}`}>
      {displayScore.toLocaleString()}
    </span>
  )
})

AnimatedScore.displayName = 'AnimatedScore'

const mockData: LeaderboardEntry[] = [
  {
    id: "1",
    name: "Alex Chen",
    handle: "alex_dev",
    avatar: "/api/placeholder/40/40",
    role: "Full Stack",
    score: 2847,
    rank: 1,
    projects: [
      { name: "AI Chat Platform", score: 950, description: "Real-time chat with AI integration" },
      { name: "E-commerce API", score: 820, description: "Scalable REST API for online store" },
      { name: "Mobile App", score: 650, description: "Cross-platform React Native app" }
    ],
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"]
  },
  {
    id: "2",
    name: "Sarah Kim",
    handle: "sarahk_design",
    avatar: "/api/placeholder/40/40",
    role: "UI/UX Designer",
    score: 2634,
    rank: 2,
    projects: [
      { name: "Design System", score: 890, description: "Complete component library and guidelines" },
      { name: "Mobile Redesign", score: 720, description: "iOS app interface overhaul" },
      { name: "Brand Identity", score: 580, description: "Logo and visual identity for startup" }
    ],
    skills: ["Figma", "Prototyping", "User Research", "Design Systems"]
  },
  {
    id: "3",
    name: "Marcus Johnson",
    handle: "mjohnson_code",
    avatar: "/api/placeholder/40/40",
    role: "Backend Dev",
    score: 2456,
    rank: 3,
    projects: [
      { name: "Microservices", score: 850, description: "Scalable service architecture" },
      { name: "Auth System", score: 730, description: "Secure authentication service" },
      { name: "Data Pipeline", score: 620, description: "Real-time data processing system" }
    ],
    skills: ["Python", "Docker", "Kubernetes", "AWS"]
  },
  {
    id: "4",
    name: "Emma Rodriguez",
    handle: "emma_frontend",
    avatar: "/api/placeholder/40/40",
    role: "Frontend Dev",
    score: 2289,
    rank: 4,
    projects: [
      { name: "Dashboard UI", score: 780, description: "Analytics dashboard with real-time charts" },
      { name: "Component Library", score: 690, description: "Reusable React components" },
      { name: "Landing Page", score: 540, description: "High-converting product landing page" }
    ],
    skills: ["React", "Vue.js", "Tailwind", "Animation"]
  },
  {
    id: "5",
    name: "David Park",
    handle: "dpark_mobile",
    avatar: "/api/placeholder/40/40",
    role: "Mobile Dev",
    score: 2156,
    rank: 5,
    projects: [
      { name: "Fitness App", score: 750, description: "iOS/Android fitness tracking app" },
      { name: "AR Shopping", score: 680, description: "Augmented reality shopping experience" },
      { name: "Payment SDK", score: 520, description: "Mobile payment integration SDK" }
    ],
    skills: ["Swift", "Kotlin", "React Native", "Flutter"]
  }
]

const LeaderboardSkeleton = memo(() => (
  <Card className="bg-primary text-primary-foreground p-6 relative overflow-hidden">
    <header className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-white/20 rounded animate-pulse"></div>
          <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="h-4 w-12 bg-white/20 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="h-8 w-8 bg-white/20 rounded animate-pulse"></div>
    </header>

    <div className="relative h-20 overflow-hidden">
      <div className="flex gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 bg-white/10 rounded-lg p-3 min-w-fit">
            <div className="flex items-center gap-2">
              <div className="h-4 w-6 bg-white/20 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-white/20 rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-white/20 rounded animate-pulse"></div>
                <div className="h-5 w-16 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-12 bg-white/20 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Card>
))

const MobileLeaderboardCard = memo(({ entry, onClick }: { entry: LeaderboardEntry; onClick: () => void }) => {
  const truncatedRole = useMemo(() => {
    return entry.role.length > 28 ? entry.role.substring(0, 25) + '...' : entry.role
  }, [entry.role])

  return (
    <motion.div
      className="bg-white/10 hover:bg-white/20 rounded-lg p-4 cursor-pointer transition-all duration-200 w-full max-w-sm mx-auto"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="text-sm font-bold text-accent w-8 text-center">
          #{entry.rank}
        </div>
        <div className="relative">
          <Avatar className={`h-12 w-12 transition-all duration-200 ${
            entry.rank <= 3
              ? 'ring-2 ring-accent shadow-lg shadow-accent/50'
              : ''
          }`}>
            <AvatarImage src={entry.avatar} alt={`${entry.name} avatar`} />
            <AvatarFallback className="bg-white/20 text-white text-sm">
              {entry.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          {entry.rank <= 3 && (
            <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {entry.rank}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-white truncate text-sm">{entry.name}</h3>
          <Badge variant="secondary" className="text-xs bg-white/20 text-white/80 mt-1">
            {truncatedRole}
          </Badge>
        </div>
        <div className="text-sm text-white/70">
          <AnimatedScore score={entry.score} isTop3={entry.rank <= 3} />
          <span className="ml-1">pts</span>
        </div>
      </div>
    </motion.div>
  )
})

MobileLeaderboardCard.displayName = 'MobileLeaderboardCard'

const MobileLeaderboardCarousel = memo(({
  data,
  onEntryClick
}: {
  data: LeaderboardEntry[]
  onEntryClick: (entry: LeaderboardEntry) => void
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % data.length)
  }, [data.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + data.length) % data.length)
  }, [data.length])

  // Auto-advance carousel (only if motion is not reduced)
  useEffect(() => {
    if (prefersReducedMotion || data.length <= 1) return

    const interval = setInterval(() => {
      nextSlide()
    }, 4000)

    return () => clearInterval(interval)
  }, [nextSlide, prefersReducedMotion, data.length])

  // Optimized touch handlers
  const minSwipeDistance = 50

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextSlide()
    }
    if (isRightSwipe) {
      prevSlide()
    }
  }, [touchStart, touchEnd, nextSlide, prevSlide])

  // Memoized dots
  const dots = useMemo(() => 
    data.length > 1 ? data.map((_, index) => (
      <button
        key={index}
        className={`w-2 h-2 rounded-full transition-colors ${
          index === currentIndex ? 'bg-accent' : 'bg-white/30'
        }`}
        onClick={() => setCurrentIndex(index)}
        aria-label={`Go to slide ${index + 1}`}
      />
    )) : null,
    [data.length, currentIndex]
  )

  return (
    <div className="relative">
      <div
        className="overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <motion.div
          className="flex"
          animate={{ x: -currentIndex * 100 + '%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {data.map((entry, index) => (
            <div key={`${entry.id}-${index}`} className="w-full flex-shrink-0 px-4">
              <MobileLeaderboardCard
                entry={entry}
                onClick={() => onEntryClick(entry)}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dots indicator */}
      {data.length > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {dots}
        </div>
      )}
    </div>
  )
})

MobileLeaderboardCarousel.displayName = 'MobileLeaderboardCarousel'

export default function LeaderboardTeaser() {
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const { isMobile } = useDeviceDetection()

  // Consolidated motion preference effect
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const shouldReduceMotion = prefersReducedMotion

  // Memoized structured data for SEO
  const leaderboardStructuredData = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Developer Leaderboard",
      "description": "Top developers ranked by their project contributions and skills",
      "numberOfItems": data.length,
      "itemListElement": data.slice(0, 10).map((entry, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Person",
          "name": entry.name,
          "alternateName": entry.handle,
          "image": entry.avatar,
          "jobTitle": entry.role,
          "knowsAbout": entry.skills
        }
      }))
    }
  }, [data])

  // Memoized extended data for seamless scrolling
  const extendedData = useMemo(() => {
    return [...data, ...data, ...data]
  }, [data])

  // Optimized fetch function
  const fetchLeaderboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/leaderboard/teaser?limit=10')

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success || !result.entries) {
        throw new Error(result.error || 'Invalid response format')
      }

      if (result.entries.length === 0) {
        setData(mockData)
      } else {
        setData(result.entries)
      }
    } catch (err) {
      console.error('Error fetching leaderboard teaser data:', err)
      setError((err as Error).message || 'Failed to load leaderboard data')
      setData(mockData)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchLeaderboardData()
  }, [fetchLeaderboardData])

  const handleEntryClick = useCallback((entry: LeaderboardEntry) => {
    setSelectedEntry(entry)
    setIsDialogOpen(true)
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent, entry: LeaderboardEntry) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleEntryClick(entry)
    }
  }, [handleEntryClick])

  const handleDialogClose = useCallback(() => {
    setSelectedEntry(null)
    setIsDialogOpen(false)
  }, [])

  // Show skeleton on initial load
  if (isLoading && data.length === 0) {
    return <LeaderboardSkeleton />
  }

  return (
    <>
      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(leaderboardStructuredData) }}
      />

      {isMobile ? (
        <section
          className="py-6 px-4"
          aria-labelledby="leaderboard-title"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-4">
              <h2
                id="leaderboard-title"
                className="text-xl font-bold text-secondary-foreground mb-1"
              >
                Top Contributors
              </h2>
              <p className="text-xs text-secondary-foreground/80 max-w-sm mx-auto">
                Meet the developers leading our community
              </p>
            </div>

            <Card className="bg-primary text-primary-foreground p-3">
              {isLoading ? (
                <LeaderboardSkeleton />
              ) : error ? (
                <div className="flex items-center justify-center p-6">
                  <div className="text-center text-white/70">
                    <span className="text-xs" role="alert">⚠️ {error}</span>
                  </div>
                </div>
              ) : (
                <MobileLeaderboardCarousel
                  data={data}
                  onEntryClick={handleEntryClick}
                />
              )}
            </Card>
          </div>
        </section>
      ) : (
        <Card className="bg-primary text-primary-foreground p-6 relative overflow-hidden">
          <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-heading font-semibold text-accent-foreground">Live Leaderboard</h2>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  isLoading ? 'bg-yellow-400 animate-pulse' :
                  error ? 'bg-red-400' :
                  'bg-green-400 animate-pulse'
                }`} aria-hidden="true" />
                <span className="text-xs text-gray-300">
                  {isLoading ? 'LOADING' : error ? 'ERROR' : 'LIVE'}
                </span>
              </div>
            </div>

          </header>

          <div
            className="relative h-20 overflow-hidden"
            role="region"
            aria-label="Live leaderboard ticker"
            aria-live="polite"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-white/70">
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="ml-2 text-sm">Loading leaderboard...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/70">
                  <span className="text-sm" role="alert">⚠️ {error}</span>
                </div>
              </div>
            ) : (
              <motion.div
                ref={scrollRef}
                className="flex gap-4 absolute top-0 left-0 h-full"
                animate={shouldReduceMotion ? {} : {
                  x: -3000
                }}
                transition={shouldReduceMotion ? {} : {
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                {extendedData.map((entry, index) => (
                  <motion.article
                    key={`${entry.id}-${index}`}
                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-3 min-w-fit cursor-pointer transition-all duration-200 group"
                    onClick={() => handleEntryClick(entry)}
                    onKeyDown={(e) => handleKeyDown(e, entry)}
                    tabIndex={0}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    role="button"
                    aria-label={`View ${entry.name}'s profile - Rank ${entry.rank} with ${entry.score} points`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-accent w-6 text-center">
                        #{entry.rank}
                      </div>
                      <div className="relative">
                        <Avatar className={`h-10 w-10 transition-all duration-200 ${
                          entry.rank <= 3
                            ? 'ring-2 ring-accent group-hover:ring-accent group-hover:shadow-lg shadow-accent/50'
                            : 'group-hover:ring-2 group-hover:ring-white/30'
                        }`}>
                          <AvatarImage src={entry.avatar} alt={`${entry.name} avatar`} />
                          <AvatarFallback className="bg-white/20 text-white">
                            {entry.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {entry.rank <= 3 && (
                          <motion.div
                            className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                            animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1] }}
                            transition={shouldReduceMotion ? {} : { duration: 2, repeat: Infinity }}
                            aria-label={`Top ${entry.rank} rank`}
                          >
                            {entry.rank}
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{entry.name}</span>
                        <Badge variant="secondary" className="text-xs bg-white/20 text-white/80 hover:bg-white/30">
                          {entry.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-white/70">
                        <AnimatedScore score={entry.score} isTop3={entry.rank <= 3} />
                        <span className="ml-1">pts</span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </div>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Suspense fallback={
          <DialogContent className="max-w-md">
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading profile...</p>
              </div>
            </div>
          </DialogContent>
        }>
          {selectedEntry && (
            <DetailPanel
              entry={selectedEntry}
              onClose={handleDialogClose}
            />
          )}
        </Suspense>
      </Dialog>
    </>
  )
}