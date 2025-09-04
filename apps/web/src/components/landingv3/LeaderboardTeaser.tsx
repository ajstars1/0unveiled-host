"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "motion/react"
import { Play, Pause, Filter, Clock, Trophy, Star, ExternalLink, X } from "lucide-react"
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
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="absolute inset-0 bg-card rounded-lg border shadow-lg z-50 p-6 overflow-y-auto"
  >
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className={`h-16 w-16 ${entry.rank <= 3 ? 'ring-2 ring-accent shadow-lg' : ''}`}>
            <AvatarImage src={entry.avatar} alt={entry.name} />
            <AvatarFallback>{entry.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          {entry.rank <= 3 && (
            <div className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {entry.rank}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-heading font-semibold">{entry.name}</h3>
          <p className="text-muted-foreground">@{entry.handle}</p>
          <Badge variant="secondary" className="mt-1">{entry.role}</Badge>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
    </div>

    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Score Breakdown
        </h4>
        <div className="bg-muted rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">{entry.score.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Points</div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Top Projects
        </h4>
        <div className="space-y-3">
          {entry.projects.map((project, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium">{project.name}</h5>
                <Badge variant="outline">{project.score.toLocaleString()} pts</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {entry.skills.map((skill, index) => (
            <Badge key={index} variant="secondary">{skill}</Badge>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={() => toast.info("Profile view coming soon!")}>
        <ExternalLink className="h-4 w-4 mr-2" />
        View Full Profile
      </Button>
    </div>
  </motion.div>
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
type SpeedSetting = "slow" | "normal" | "fast"

export default function LeaderboardTeaser() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState<SpeedSetting>("normal")
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null)
  const [data, setData] = useState(mockData)
  const [isHovered, setIsHovered] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const speedSettings = {
    slow: 40,
    normal: 60,
    fast: 100
  }

  // Simulate live score updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(entry => ({
        ...entry,
        score: entry.score + Math.floor(Math.random() * 10) - 3
      })).sort((a, b) => b.score - a.score).map((entry, index) => ({
        ...entry,
        rank: index + 1
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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
    <Card className="bg-primary text-primary-foreground p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-heading font-semibold">Live Leaderboard</h2>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-300">LIVE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/10 rounded-md p-1">
            {(["today", "week", "all"] as TimeFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTimeFilter(filter)}
              >
                {filter === "today" ? "Today" : filter === "week" ? "Week" : "All Time"}
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <div className="flex items-center gap-1 bg-white/10 rounded-md p-1">
            {(["slow", "normal", "fast"] as SpeedSetting[]).map((speedOption) => (
              <Button
                key={speedOption}
                variant={speed === speedOption ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setSpeed(speedOption)}
              >
                {speedOption}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div 
        className="relative h-20 overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="Live leaderboard ticker"
        aria-live="polite"
      >
        <motion.div
          ref={scrollRef}
          className="flex gap-4 absolute top-0 left-0 h-full"
          animate={isPlaying && !isHovered ? {
            x: [`0%`, `-${100 / 3}%`]
          } : {}}
          transition={{
            duration: speedSettings[speed],
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
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <DetailPanel
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>
    </Card>
  )
}