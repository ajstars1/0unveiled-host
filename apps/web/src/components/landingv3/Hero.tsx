"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, memo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Star, Trophy, Target, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useDeviceDetection } from '@/hooks/use-device-detection'
import { useRouter } from 'next/navigation'

// Structured data for SEO
const HERO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "0Unveiled - AI-Powered Developer Portfolio Platform",
  "description": "Transform your portfolio into a competitive advantage with AI-powered scoring, leaderboards, and job matching. Get discovered by top companies.",
  "url": "https://0unveiled.com",
  "mainEntity": {
    "@type": "SoftwareApplication",
    "name": "0Unveiled",
    "description": "AI-powered platform for developers to showcase skills, get scored, and get discovered by companies",
    "applicationCategory": "Developer Tools",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
} as const

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
  icon: ReactNode
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

export default memo(function Hero() {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'tiles' | 'scanning' | 'transform' | 'complete'>('idle')
  const [showScorePanel, setShowScorePanel] = useState(false)
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)
  const shouldReduceMotion = useReducedMotion()
  const timersRef = useRef<number[]>([])
  const { isMobile, isTablet } = useDeviceDetection()
  const router = useRouter()

  // Precompute deterministic tile positions/rotations to avoid hydration mismatches
  type TileLayout = { initialX: number; initialY: number; initialRotate: number; targetX: number; targetY: number }
  const tileLayouts: TileLayout[] = useMemo(() => {
    return projectTiles.map((_, index) => {
      // Create pseudo-random but deterministic values derived from index
      const isSmallScreen = isMobile || isTablet
      
      // Adjust distances for mobile/tablet
      const initialX = isSmallScreen 
        ? (index % 2 === 0 ? -120 : 120)  // Smaller movement on mobile
        : (index % 2 === 0 ? -200 : 200)
      
      const initialY = isSmallScreen 
        ? 80 + ((index * 137) % 280)  // Smaller range on mobile
        : 120 + ((index * 137) % 420)
      
      const initialRotate = ((index * 47) % 60) - 30 // -30..30 deg
      
      // Adjust target positions for mobile/tablet
      const targetX = isSmallScreen 
        ? 100 + ((index % 3) - 1) * 25  // Closer together on mobile
        : 160 + ((index % 3) - 1) * 40
      
      const targetY = isSmallScreen 
        ? 140 + (Math.floor(index / 3) - 1) * 35  // Closer together on mobile
        : 200 + (Math.floor(index / 3) - 1) * 60
      
      return { initialX, initialY, initialRotate, targetX, targetY }
    })
  }, [isMobile, isTablet])

  const clearTimers = () => {
    // Clear any pending timeouts to avoid state updates on unmounted component
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current = []
  }

  useEffect(() => {
    if (!shouldReduceMotion) {
      const timer = window.setTimeout(() => {
        setAnimationPhase('tiles')
        timersRef.current.push(
          window.setTimeout(() => setAnimationPhase('scanning'), 1500)
        )
        timersRef.current.push(
          window.setTimeout(() => setAnimationPhase('transform'), 3000)
        )
        timersRef.current.push(
          window.setTimeout(() => {
          setAnimationPhase('complete')
        }, 4500)
        )
      }, 1000)
      return () => {
        clearTimeout(timer)
        clearTimers()
      }
    } else {
      setAnimationPhase('complete')
    }
  }, [shouldReduceMotion])

  const handleGetStarted = useCallback(() => {
    router.push('/profile/edit')
  }, [router])

  const handleExploreLeaderboards = useCallback(() => {
    router.push('/leaderboard')
  }, [router])

  const handleScoreClick = useCallback(() => {
    setShowScorePanel(!showScorePanel)
  }, [showScorePanel])

  // Memoize animation variants to prevent recreation
  const resumePanelVariants = useMemo(() => ({
    initial: { opacity: 0, scale: 0.8, rotateY: -15 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      rotateY: 0,
      z: animationPhase === 'transform' ? 50 : 0
    }
  }), [animationPhase])

  const profileCardVariants = useMemo(() => ({
    initial: { opacity: 0, x: isMobile ? 50 : 100, rotateY: 45 },
    animate: { 
      opacity: animationPhase === 'transform' || animationPhase === 'complete' ? 1 : 0,
      x: animationPhase === 'transform' || animationPhase === 'complete' ? 0 : (isMobile ? 50 : 100),
      rotateY: 0
    }
  }), [animationPhase, isMobile])

  const heroTextVariants = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: animationPhase === 'complete' ? 1 : 0.3,
      y: animationPhase === 'complete' ? 0 : 10
    }
  }), [animationPhase])

  // Memoize leaderboard badges to prevent unnecessary re-renders
  const memoizedLeaderboardBadges = useMemo(() => 
    leaderboardBadges.map((badge, index) => {
      // Adjust badge positioning for mobile
      const radius = isMobile ? 100 : 150  // Smaller radius on mobile
      const angle = (index * 120 + 90) * Math.PI / 180
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      
      return (
        <motion.button
          key={badge.id}
          initial={{ opacity: 0, scale: 0, rotate: 180 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            rotate: 0,
            x: x,
            y: y
          }}
          transition={{ 
            duration: 0.6, 
            delay: 0.8 + index * 0.1,
            type: 'spring',
            stiffness: 200
          }}
          className={`absolute top-1/2 left-1/2 w-12 h-12 lg:w-16 lg:h-16 bg-accent text-accent-foreground rounded-full flex flex-col items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform z-30 ${
            isMobile ? 'text-xs' : ''
          }`}
          onMouseEnter={() => setHoveredBadge(badge.id)}
          onMouseLeave={() => setHoveredBadge(null)}
          onFocus={() => setHoveredBadge(badge.id)}
          onBlur={() => setHoveredBadge(null)}
          type="button"
          aria-label={`${badge.category} rank ${badge.rank}, score ${badge.score}`}
          aria-describedby={hoveredBadge === badge.id ? `badge-tooltip-${badge.id}` : undefined}
        >
          <div className={isMobile ? 'scale-75' : ''}>
            {badge.icon}
          </div>
          <span className={`font-bold ${isMobile ? 'text-xs' : 'text-xs'}`}>#{badge.rank}</span>
          
          {/* Tooltip - hide on mobile to save space */}
          {!isMobile && (
            <AnimatePresence>
              {hoveredBadge === badge.id && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs whitespace-nowrap"
                  role="tooltip"
                  id={`badge-tooltip-${badge.id}`}
                >
                  {badge.category}: {badge.score}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-primary"></div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </motion.button>
      )
    }), [isMobile, hoveredBadge]
  )

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(HERO_SCHEMA)
        }}
      />
      
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20"
        itemScope 
        itemType="https://schema.org/WebPage"
      >
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} aria-hidden="true" />
        
        {/* Reduced Motion Indicator */}
        {shouldReduceMotion && (
          <div className="absolute top-6 left-6 z-50">
            <div className="bg-muted/80 backdrop-blur-sm rounded-md px-3 py-1 text-sm text-muted-foreground">
              Reduced motion enabled
            </div>
          </div>
        )}

        <div className="container relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Hero Content */}
            <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
              <motion.div
                initial="initial"
                animate="animate"
                variants={heroTextVariants}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-4 lg:space-y-6"
              >
                <h1 
                  className="text-3xl sm:text-4xl lg:text-6xl font-heading font-bold leading-tight"
                  itemProp="name"
                >
                  Verify Skills.{' '}
                  <span className="text-primary">Build Trust.</span>{' '}
                  <span className="bg-accent text-accent-foreground px-2 py-1 rounded-lg ">
                    Get Hired.
                  </span>
                </h1>
                
                <p 
                  className="text-base lg:text-xl text-muted-foreground max-w-lg"
                  itemProp="description"
                >
                  Transform your portfolio into a competitive advantage. Get AI-powered scores, 
                  climb leaderboards, and land your dream job.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                  <Button 
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 lg:px-8 py-3 h-auto shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
                    itemProp="potentialAction"
                    itemScope
                    itemType="https://schema.org/Action"
                  >
                    <meta itemProp="name" content="Get Started" />
                    Get Started
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExploreLeaderboards}
                    size="lg"
                    className="border-2 border-primary/30 hover:border-primary hover:bg-primary/5 font-semibold px-6 lg:px-8 py-3 h-auto transition-all duration-300"
                  >
                    Explore Leaderboards
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Animation Canvas */}
            <div className="relative h-[500px] sm:h-[600px] lg:h-[700px] order-1 lg:order-2">
              {/* Central Resume Panel */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={resumePanelVariants}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`absolute bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden ${
                  isMobile 
                    ? 'inset-x-4 top-12 bottom-24'  // More space on mobile
                    : 'inset-x-8 top-16 bottom-32'  // Original desktop spacing
                }`}
                style={{ 
                  transformStyle: 'preserve-3d',
                  perspective: '1000px'
                }}
                role="img"
                aria-label="Portfolio resume preview"
              >
                {/* Resume Content */}
                <div className="p-8 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div 
                      className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl"
                      role="img"
                      aria-label="Profile avatar"
                    ></div>
                    <div>
                      <h3 className="font-heading font-semibold text-lg">Keshav Sharma</h3>
                      <p className="text-muted-foreground">Full Stack Developer</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    <div className="h-3 bg-muted rounded w-3/4" aria-hidden="true"></div>
                    <div className="h-3 bg-muted rounded w-1/2" aria-hidden="true"></div>
                    <div className="h-3 bg-muted rounded w-5/6" aria-hidden="true"></div>
                    
                    <div className="mt-6 space-y-3">
                      <div className="h-2 bg-muted rounded w-full" aria-hidden="true"></div>
                      <div className="h-2 bg-muted rounded w-4/5" aria-hidden="true"></div>
                      <div className="h-2 bg-muted rounded w-3/5" aria-hidden="true"></div>
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
                      aria-hidden="true"
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
                    {projectTiles.slice(0, isMobile ? 4 : 6).map((tile, index) => {  // Show fewer tiles on mobile
                      const layout = tileLayouts[index]
                      return (
                      <motion.div
                        key={tile.id}
                        initial={{ 
                          x: layout.initialX,
                          y: layout.initialY,
                          rotate: layout.initialRotate,
                          opacity: 0
                        }}
                        animate={{ 
                          x: layout.targetX,
                          y: layout.targetY,
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
                        className={`absolute rounded-lg shadow-lg flex items-center justify-center text-white font-medium p-2 text-center leading-tight ${
                          isMobile 
                            ? 'w-16 h-12 text-xs'  // Smaller tiles on mobile
                            : 'w-20 h-16 text-xs'
                        }`}
                        style={{ backgroundColor: tile.color }}
                        role="img"
                        aria-label={`Project: ${tile.title}`}
                      >
                        {isMobile ? tile.title.split(' ')[0] : tile.title}  {/* Shorter titles on mobile */}
                      </motion.div>
                      )
                    })}
                  </>
                )}
              </AnimatePresence>

              {/* Profile Card */}
              <motion.div
                initial="initial"
                animate="animate"
                variants={profileCardVariants}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`absolute bg-primary text-primary-foreground rounded-2xl shadow-2xl p-4 lg:p-6 z-20 ${
                  isMobile 
                    ? 'right-2 top-1/3 -translate-y-1/2 w-64'  // Smaller and repositioned for mobile
                    : 'right-0 top-1/2 -translate-y-1/2 w-80'  // Original desktop size
                }`}
                style={{ transformStyle: 'preserve-3d' }}
                role="complementary"
                aria-label="Developer profile and ranking information"
              >
                <div className="flex items-center gap-3 lg:gap-4 mb-4 lg:mb-6">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-accent-foreground" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm lg:text-lg text-accent-foreground">Keshav Sharma</h3>
                    <p className="text-primary-foreground/70 text-xs lg:text-sm">Ranked #47 globally</p>
                  </div>
                </div>

                {/* Score Dial */}
                <div className="relative mb-4 lg:mb-6">
                  <button
                    onClick={handleScoreClick}
                    className={`relative mx-auto flex items-center justify-center rounded-full border-4 border-accent bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors cursor-pointer group ${
                      isMobile ? 'w-20 h-20' : 'w-24 h-24'
                    }`}
                    aria-expanded={showScorePanel}
                    aria-controls="score-panel"
                    aria-label="View score metrics"
                  >
                    <div className="text-center">
                      <div className={`font-bold text-accent ${isMobile ? 'text-xl' : 'text-2xl'}`}>94</div>
                      <div className={`text-primary-foreground/70 ${isMobile ? 'text-xs' : 'text-xs'}`}>Score</div>
                    </div>
                    <svg className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
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
                        className={`absolute left-1/2 -translate-x-1/2 top-full mt-4 bg-card text-card-foreground rounded-xl shadow-xl p-3 lg:p-4 z-30 ${
                          isMobile ? 'w-56' : 'w-64'  // Smaller width on mobile
                        }`}
                        id="score-panel"
                        role="dialog"
                        aria-label="Top metrics panel"
                      >
                        <h4 className="font-semibold mb-2 lg:mb-3 text-center text-sm lg:text-base">Top Metrics</h4>
                        <div className="space-y-1.5 lg:space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm">Technical Accuracy</span>
                            <span className="font-semibold text-accent text-xs lg:text-sm">96</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm">Project Impact</span>
                            <span className="font-semibold text-accent text-xs lg:text-sm">92</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs lg:text-sm">Code Quality</span>
                            <span className="font-semibold text-accent text-xs lg:text-sm">94</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className={`text-primary-foreground/80 text-center ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  Outstanding portfolio with exceptional technical depth and innovation.
                </p>
              </motion.div>

              {/* Leaderboard Badges */}
              <AnimatePresence>
                {animationPhase === 'complete' && memoizedLeaderboardBadges}
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
    </>
  )
})