"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, Pause, Star, Trophy, Target, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface ProjectTile {
  id: string
  title: string
  type: 'design' | 'code' | 'data'
  color: string
}

interface LeaderboardBadge {
  id: string
  rank: number
  category: string
  score: number
  icon: React.ReactNode
}

const projectTiles: ProjectTile[] = [
  { id: '1', title: 'E-commerce Dashboard', type: 'design', color: '#3b82f6' },
  { id: '2', title: 'React Component Library', type: 'code', color: '#10b981' },
  { id: '3', title: 'Sales Analytics Model', type: 'data', color: '#f59e0b' },
  { id: '4', title: 'Mobile App Prototype', type: 'design', color: '#8b5cf6' },
  { id: '5', title: 'API Integration', type: 'code', color: '#ef4444' },
  { id: '6', title: 'User Research Study', type: 'data', color: '#06b6d4' },
]

const leaderboardBadges: LeaderboardBadge[] = [
  { id: '1', rank: 3, category: 'Design', score: 94, icon: <Target className="w-3 h-3" /> },
  { id: '2', rank: 1, category: 'Frontend', score: 98, icon: <Zap className="w-3 h-3" /> },
  { id: '3', rank: 7, category: 'Innovation', score: 87, icon: <Star className="w-3 h-3" /> },
]

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'tiles' | 'scanning' | 'transform' | 'complete'>('idle')
  const [showScorePanel, setShowScorePanel] = useState(false)
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const startAnimation = () => {
    if (shouldReduceMotion) {
      setAnimationPhase('complete')
      return
    }
    
    setIsPlaying(true)
    setAnimationPhase('tiles')
    
    setTimeout(() => setAnimationPhase('scanning'), 1500)
    setTimeout(() => setAnimationPhase('transform'), 3000)
    setTimeout(() => {
      setAnimationPhase('complete')
      setIsPlaying(false)
    }, 4500)
  }

  const resetAnimation = () => {
    setIsPlaying(false)
    setAnimationPhase('idle')
    setShowScorePanel(false)
  }

  useEffect(() => {
    if (!shouldReduceMotion) {
      const timer = setTimeout(startAnimation, 1000)
      return () => clearTimeout(timer)
    } else {
      setAnimationPhase('complete')
    }
  }, [shouldReduceMotion])

  const handleGetStarted = () => {
    toast.success('Welcome! Let\'s build your portfolio.')
  }

  const handleExploreLeaderboards = () => {
    toast.info('Leaderboards coming soon!')
  }

  const handleScoreClick = () => {
    setShowScorePanel(!showScorePanel)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-bg-gradient-start to-bg-gradient-end">
      {/* Animation Controls */}
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={isPlaying ? resetAnimation : startAnimation}
          className="bg-card/80 backdrop-blur-sm"
          disabled={shouldReduceMotion}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="ml-2">{isPlaying ? 'Reset' : 'Replay'}</span>
        </Button>
      </div>

      {/* Reduced Motion Indicator */}
      {shouldReduceMotion && (
        <div className="absolute top-6 left-6 z-50">
          <div className="bg-muted/80 backdrop-blur-sm rounded-md px-3 py-1 text-sm text-muted-foreground">
            Reduced motion enabled
          </div>
        </div>
      )}

      <div className="container relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Hero Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: animationPhase === 'complete' ? 1 : 0,
                y: animationPhase === 'complete' ? 0 : 20
              }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-4xl lg:text-6xl font-heading font-bold leading-tight">
                Show Your Work.{' '}
                <span className="text-primary">Get Scored.</span>{' '}
                <span className="bg-accent text-accent-foreground px-2 py-1 rounded-lg">
                  Get Hired.
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-muted-foreground max-w-lg">
                Transform your portfolio into a competitive advantage. Get AI-powered scores, 
                climb leaderboards, and land your dream job.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 h-auto hover:shadow-lg hover:shadow-accent/20 transition-all duration-300"
                >
                  Get Started
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExploreLeaderboards}
                  size="lg"
                  className="border-2 border-primary/20 hover:border-accent hover:bg-accent/10 font-semibold px-8 py-3 h-auto transition-all duration-300"
                >
                  Explore Leaderboards
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Animation Canvas */}
          <div className="relative h-[600px] lg:h-[700px]">
            {/* Central Resume Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotateY: 0,
                z: animationPhase === 'transform' ? 50 : 0
              }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute inset-x-8 top-16 bottom-32 bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden"
              style={{ 
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              {/* Resume Content */}
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl"></div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg">Alex Johnson</h3>
                    <p className="text-muted-foreground">Full Stack Developer</p>
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                  
                  <div className="mt-6 space-y-3">
                    <div className="h-2 bg-muted rounded w-full"></div>
                    <div className="h-2 bg-muted rounded w-4/5"></div>
                    <div className="h-2 bg-muted rounded w-3/5"></div>
                  </div>
                </div>
              </div>

              {/* Scanning Overlay */}
              <AnimatePresence>
                {animationPhase === 'scanning' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent"
                  >
                    <motion.div
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 1.5, ease: 'easeInOut' }}
                      className="h-full w-32 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,theme(colors.accent)_50%,transparent_51%)] bg-[length:20px_20px] opacity-20" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Flying Project Tiles */}
            <AnimatePresence>
              {(animationPhase === 'tiles' || animationPhase === 'scanning') && (
                <>
                  {projectTiles.map((tile, index) => (
                    <motion.div
                      key={tile.id}
                      initial={{ 
                        x: index % 2 === 0 ? -200 : 200,
                        y: Math.random() * 400 + 100,
                        rotate: Math.random() * 60 - 30,
                        opacity: 0
                      }}
                      animate={{ 
                        x: 160 + (index % 3 - 1) * 40,
                        y: 200 + (Math.floor(index / 3) - 1) * 60,
                        rotate: 0,
                        opacity: 1
                      }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ 
                        duration: 1,
                        delay: index * 0.1,
                        type: 'spring',
                        stiffness: 100
                      }}
                      className="absolute w-20 h-16 rounded-lg shadow-lg flex items-center justify-center text-white text-xs font-medium p-2 text-center leading-tight"
                      style={{ backgroundColor: tile.color }}
                    >
                      {tile.title}
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: 100, rotateY: 45 }}
              animate={{ 
                opacity: animationPhase === 'transform' || animationPhase === 'complete' ? 1 : 0,
                x: animationPhase === 'transform' || animationPhase === 'complete' ? 0 : 100,
                rotateY: 0
              }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-80 bg-primary text-primary-foreground rounded-2xl shadow-2xl p-6 z-20"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">Alex Johnson</h3>
                  <p className="text-primary-foreground/70 text-sm">Ranked #47 globally</p>
                </div>
              </div>

              {/* Score Dial */}
              <div className="relative mb-6">
                <button
                  onClick={handleScoreClick}
                  className="relative w-24 h-24 mx-auto flex items-center justify-center rounded-full border-4 border-accent bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors cursor-pointer group"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">94</div>
                    <div className="text-xs text-primary-foreground/70">Score</div>
                  </div>
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-primary-foreground/20"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${94 * 2.51} 251`}
                      className="text-accent transition-all duration-500 group-hover:text-accent/80"
                    />
                  </svg>
                </button>

                {/* Expandable Score Panel */}
                <AnimatePresence>
                  {showScorePanel && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-4 bg-card text-card-foreground rounded-xl shadow-xl p-4 w-64 z-30"
                    >
                      <h4 className="font-semibold mb-3 text-center">Top Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Technical Accuracy</span>
                          <span className="font-semibold text-accent">96</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Project Impact</span>
                          <span className="font-semibold text-accent">92</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Code Quality</span>
                          <span className="font-semibold text-accent">94</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="text-primary-foreground/80 text-sm text-center">
                Outstanding portfolio with exceptional technical depth and innovation.
              </p>
            </motion.div>

            {/* Leaderboard Badges */}
            <AnimatePresence>
              {(animationPhase === 'complete') && (
                <>
                  {leaderboardBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ opacity: 0, scale: 0, rotate: 180 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        rotate: 0,
                        x: Math.cos((index * 120 + 90) * Math.PI / 180) * 150,
                        y: Math.sin((index * 120 + 90) * Math.PI / 180) * 150
                      }}
                      transition={{ 
                        duration: 0.6, 
                        delay: 0.8 + index * 0.1,
                        type: 'spring',
                        stiffness: 200
                      }}
                      className="absolute top-1/2 left-1/2 w-16 h-16 bg-accent text-accent-foreground rounded-full flex flex-col items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform z-30"
                      onMouseEnter={() => setHoveredBadge(badge.id)}
                      onMouseLeave={() => setHoveredBadge(null)}
                    >
                      {badge.icon}
                      <span className="text-xs font-bold">#{badge.rank}</span>
                      
                      {/* Tooltip */}
                      <AnimatePresence>
                        {hoveredBadge === badge.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs whitespace-nowrap"
                          >
                            {badge.category}: {badge.score}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Aria-live region for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {animationPhase === 'complete' && (
          'Hero animation complete. Portfolio scoring demonstration ready. Get started button available.'
        )}
      </div>
    </section>
  )
}