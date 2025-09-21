"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "motion/react"
import { Play, Pause, Trophy, Star, ExternalLink, X } from "lucide-react"
import { toast } from "sonner"

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

const DetailPanel = ({ entry, onClose }: DetailPanelProps) => (
  <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
    <DialogHeader className="pb-4">
      <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <Link href={`/${entry.handle}`} className="relative flex-shrink-0">
          <Avatar className={`h-12 w-12 sm:h-16 sm:w-16 ${entry.rank <= 3 ? 'ring-2 ring-accent shadow-lg' : ''} cursor-pointer hover:opacity-80 transition-opacity`}>
            <AvatarImage src={entry.avatar} alt={entry.name} />
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
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4 sm:space-y-6">
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
          <Trophy className="h-4 w-4" />
          Score Breakdown
        </h4>
        <div className="bg-muted rounded-lg p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-primary">{entry.score.toLocaleString()}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total Points</div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
          <Star className="h-4 w-4" />
          Top Projects
        </h4>
        <div className="space-y-2 sm:space-y-3">
          {entry.projects.map((project, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <h5 className="font-medium text-sm sm:text-base">{project.name}</h5>
                <Badge variant="outline" className="text-xs self-start sm:self-auto">{project.score.toLocaleString()} pts</Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{project.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-sm sm:text-base">Skills</h4>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {entry.skills.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-xs">{skill}</Badge>
          ))}
        </div>
      </div>

      <Button className="w-full text-sm sm:text-base" onClick={() => toast.info("Profile view coming soon!")}>
        <ExternalLink className="h-4 w-4 mr-2" />
        View Full Profile
      </Button>
    </div>
  </DialogContent>
)

const AnimatedScore = ({ score, isTop3 }: { score: number; isTop3: boolean }) => {
  const [displayScore, setDisplayScore] = useState(score)
  const prevScore = useRef(score)

  useEffect(() => {
    if (score !== prevScore.current) {
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
    }
  }, [score])

  return (
    <span className={`font-bold tabular-nums ${isTop3 ? 'text-accent' : 'text-primary'}`}>
      {displayScore.toLocaleString()}
    </span>
  )
}

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

type TimeFilter = "today" | "week" | "all"

export default function LeaderboardTeaser() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch real leaderboard data
  useEffect(() => {
    const fetchLeaderboardData = async () => {
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
          // Use mock data if API returns empty
          setData(mockData)
        } else {
          setData(result.entries)
        }
      } catch (err) {
        console.error('Error fetching leaderboard teaser data:', err)
        setError((err as Error).message || 'Failed to load leaderboard data')
        // Fall back to mock data on error
        setData(mockData)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchLeaderboardData()
  }, [])

  // Simulate live score updates (only when we have real data)
  useEffect(() => {
    if (isLoading || error || data === mockData) return

    const interval = setInterval(() => {
      // Refetch data to get latest scores
      fetch('/api/leaderboard/teaser?limit=10')
        .then(response => response.json())
        .then(result => {
          if (result.success && result.entries && result.entries.length > 0) {
            setData(result.entries)
          }
        })
        .catch(err => console.error('Error updating leaderboard:', err))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [isLoading, error, data, mockData])

  // Check for rank changes and announce
  useEffect(() => {
    const topThree = data.slice(0, 3)
    const newLeader = topThree[0]
    
    if (newLeader && newLeader.rank === 1) {
      // Announce new leader occasionally
      if (Math.random() < 0.1) {
        toast.success(`${newLeader.name} takes the lead!`, {
          description: `Now at ${newLeader.score.toLocaleString()} points`
        })
      }
    }
  }, [data])

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

  const filteredData = data.filter(entry => {
    // Mock filtering logic - in real app would filter by actual timeframe
    return true
  })

  // Create extended array for seamless looping
  const extendedData = [...filteredData, ...filteredData, ...filteredData]

  return (
    <>
      <Card className="bg-primary text-primary-foreground p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-heading font-semibold text-accent-foreground">Live Leaderboard</h2>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                isLoading ? 'bg-yellow-400 animate-pulse' : 
                error ? 'bg-red-400' : 
                'bg-green-400 animate-pulse'
              }`} />
              <span className="text-xs text-gray-300">
                {isLoading ? 'LOADING' : error ? 'ERROR' : 'LIVE'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

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
                <span className="text-sm">⚠️ {error}</span>
              </div>
            </div>
          ) : (
            <motion.div
              ref={scrollRef}
              className="flex gap-4 absolute top-0 left-0 h-full"
              animate={{
                x: isPlaying ? -3000 : 3000
              }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {extendedData.map((entry, index) => (
                <motion.div
                  key={`${entry.id}-${index}`}
                  className="flex items-center gap-3 bg-white/10 hover:bg-white/20 rounded-lg p-3 min-w-fit cursor-pointer transition-all duration-200 group"
                  onClick={() => handleEntryClick(entry)}
                  onKeyDown={(e) => handleKeyDown(e, entry)}
                  tabIndex={0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
                        <AvatarImage src={entry.avatar} alt={entry.name} />
                        <AvatarFallback className="bg-white/20 text-white">
                          {entry.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {entry.rank <= 3 && (
                        <motion.div
                          className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
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
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedEntry && (
          <DetailPanel
            entry={selectedEntry}
            onClose={() => {
              setSelectedEntry(null)
              setIsDialogOpen(false)
            }}
          />
        )}
      </Dialog>
    </>
  )
}