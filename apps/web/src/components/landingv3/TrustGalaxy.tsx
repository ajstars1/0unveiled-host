"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Filter } from 'lucide-react'

interface TrustItem {
  id: string
  name: string
  role: string
  company: string
  avatar: string
  skills: string[]
  projects: Array<{
    title: string
    thumbnail: string
  }>
  quote: string
  rating: number
}

interface CompanyLogo {
  name: string
  logo: string
}

// Fallback placeholders (used only if API returns no data)
const fallbackItems: TrustItem[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'TechFlow',
    avatar: '/avatars/sarah.jpg',
    skills: ['Product Strategy', 'User Research', 'Analytics'],
    projects: [
      { title: 'Mobile App Redesign', thumbnail: '/projects/mobile.jpg' },
      { title: 'Dashboard Analytics', thumbnail: '/projects/dashboard.jpg' }
    ],
    quote: 'Working with this team transformed our product development process. Their attention to detail and user-centric approach delivered exceptional results.',
    rating: 5
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    role: 'Engineering Lead',
    company: 'DevCorp',
    avatar: '/avatars/marcus.jpg',
    skills: ['React', 'Node.js', 'TypeScript'],
    projects: [
      { title: 'E-commerce Platform', thumbnail: '/projects/ecommerce.jpg' },
      { title: 'API Integration', thumbnail: '/projects/api.jpg' }
    ],
    quote: 'The technical expertise and collaborative approach made complex challenges feel manageable. Outstanding engineering partnership.',
    rating: 5
  },
  {
    id: '3',
    name: 'Emma Thompson',
    role: 'Design Director',
    company: 'CreativeStudio',
    avatar: '/avatars/emma.jpg',
    skills: ['UI/UX Design', 'Figma', 'Design Systems'],
    projects: [
      { title: 'Brand Identity', thumbnail: '/projects/brand.jpg' },
      { title: 'Design System', thumbnail: '/projects/system.jpg' }
    ],
    quote: 'Incredible design thinking and execution. They brought our vision to life with pixel-perfect precision and thoughtful interactions.',
    rating: 5
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Startup Founder',
    company: 'InnovateLab',
    avatar: '/avatars/david.jpg',
    skills: ['Strategy', 'Growth', 'MVP Development'],
    projects: [
      { title: 'SaaS Platform', thumbnail: '/projects/saas.jpg' },
      { title: 'Landing Page', thumbnail: '/projects/landing.jpg' }
    ],
    quote: 'From concept to launch, they guided us through every step. The MVP exceeded expectations and helped us secure Series A funding.',
    rating: 5
  },
  {
    id: '5',
    name: 'Lisa Park',
    role: 'Marketing Head',
    company: 'GrowthCo',
    avatar: '/avatars/lisa.jpg',
    skills: ['Digital Marketing', 'SEO', 'Content Strategy'],
    projects: [
      { title: 'Marketing Site', thumbnail: '/projects/marketing.jpg' },
      { title: 'Campaign Landing', thumbnail: '/projects/campaign.jpg' }
    ],
    quote: 'The marketing website they built increased our conversion rate by 40%. Beautiful design meets performance optimization.',
    rating: 5
  }
]

const companyLogos: CompanyLogo[] = [
  { name: 'TechFlow', logo: '/logos/techflow.svg' },
  { name: 'DevCorp', logo: '/logos/devcorp.svg' },
  { name: 'CreativeStudio', logo: '/logos/creative.svg' },
  { name: 'InnovateLab', logo: '/logos/innovate.svg' },
  { name: 'GrowthCo', logo: '/logos/growth.svg' },
  { name: 'DataSync', logo: '/logos/datasync.svg' },
  { name: 'CloudTech', logo: '/logos/cloud.svg' },
  { name: 'FinanceApp', logo: '/logos/finance.svg' }
]

interface TrustCardProps {
  testimonial: TrustItem
  index: number
  totalCount: number
  isHovered: boolean
  onHover: (id: string | null) => void
  onSkillClick: (skill: string) => void
  selectedSkill: string | null
}

function TrustCard({ testimonial, index, totalCount, isHovered, onHover, onSkillClick, selectedSkill }: TrustCardProps) {
  const controls = useAnimation()
  const reducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)

  // Better distribution of cards around the orbit
  const orbitRadius = Math.min(200 + (index * 20), 400) // Cap maximum radius
  
  // Slower rotation for better readability
  const orbitDuration = 60 + (index * 8) // Slower orbits
  
  // Different starting positions to prevent overlap
  const startingAngle = (360 / Math.max(totalCount, 1)) * index + (index % 2 === 0 ? 15 : -15)

  useEffect(() => {
    if (reducedMotion) return

    if (isHovered) {
      controls.stop()
    } else {
      controls.start({
        rotate: 360,
        transition: {
          duration: orbitDuration,
          repeat: Infinity,
          ease: "linear"
        }
      })
    }
  }, [isHovered, controls, orbitDuration, reducedMotion])

  const shouldHighlight = selectedSkill ? testimonial.skills.includes(selectedSkill) : false

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transformOrigin: `0 ${orbitRadius}px`
          }}
          animate={controls}
          initial={{ rotate: startingAngle }} 
          onHoverStart={() => onHover(testimonial.id)}
          onHoverEnd={() => onHover(null)}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            className={`
              w-48 bg-primary text-primary-foreground cursor-pointer transition-all duration-300 
              ${shouldHighlight ? 'ring-2 ring-accent shadow-lg' : ''}
              ${selectedSkill && !shouldHighlight ? 'opacity-40' : ''}
            `}
            style={{
              transform: `translate(-50%, -${orbitRadius}px)`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 ring-1 ring-accent">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-medium text-xs">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs truncate">{testimonial.name}</h3>
                  <p className="text-xs text-primary-foreground/70 truncate">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {testimonial.skills.slice(0, 2).map((skill) => (
                  <Badge 
                    key={skill}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSkillClick(skill)
                    }}
                  >
                    {skill}
                  </Badge>
                ))}
                {testimonial.skills.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    +{testimonial.skills.length - 2}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-0.5 mt-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-2.5 w-2.5 fill-accent text-accent" />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
              <AvatarFallback className="bg-accent text-accent-foreground font-medium">
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{testimonial.name}</h3>
              <p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <blockquote className="text-lg italic border-l-4 border-accent pl-4">
            "{testimonial.quote}"
          </blockquote>

          <div className="space-y-3">
            <h4 className="font-medium">Skills & Expertise</h4>
            <div className="flex flex-wrap gap-2">
              {testimonial.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {testimonial.projects && testimonial.projects.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Featured Projects</h4>
              <div className="grid grid-cols-2 gap-3">
                {testimonial.projects.map((project, idx) => (
                  <div key={idx} className="bg-muted rounded-lg p-3">
                    <div className="h-20 bg-muted-foreground/10 rounded mb-2"></div>
                    <p className="text-sm font-medium">{project.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rating:</span>
            <div className="flex items-center gap-1">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function TrustGalaxy() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [items, setItems] = useState<TrustItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    let isActive = true
    const fetchItems = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/leaderboard/trust?limit=12', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const data = await res.json() as { success: boolean; items?: TrustItem[]; error?: string }
        if (!data.success || !data.items) throw new Error(data.error || 'Failed to load data')
        if (isActive) setItems(data.items)
      } catch (e: any) {
        if (isActive) setError(e?.message || 'Failed to load data')
      } finally {
        if (isActive) setLoading(false)
      }
    }
    fetchItems()
    return () => { isActive = false }
  }, [])

  const data = useMemo<TrustItem[]>(() => items && items.length > 0 ? items : fallbackItems, [items])
  const allSkills = useMemo(() => Array.from(new Set(data.flatMap(t => t.skills))).slice(0, 12), [data])
  const filtered = useMemo(
    () => selectedSkill ? data.filter(t => t.skills.includes(selectedSkill)) : data,
    [selectedSkill, data]
  )

  const handleSkillClick = (skill: string) => {
    setSelectedSkill(selectedSkill === skill ? null : skill)
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Trusted by Innovation Leaders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a constellation of forward-thinking companies and creators who've transformed their ideas into reality
          </p>
        </div>

        {/* Skill Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Button
            variant={selectedSkill === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSkill(null)}
            className="text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            All
          </Button>
          {allSkills.map((skill) => (
            <Button
              key={skill}
              variant={selectedSkill === skill ? "default" : "outline"}
              size="sm"
              onClick={() => handleSkillClick(skill)}
              className="text-xs"
            >
              {skill}
            </Button>
          ))}
        </div>

        {/* Trust Galaxy */}
        <div className="relative mx-auto" style={{ height: '700px', maxWidth: '900px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent rounded-full opacity-50"></div>
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Loading talent galaxy...</p>
              </div>
            </div>
          )}
          
          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-destructive/10 p-4 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* User cards */}
          {!loading && !error && filtered.map((testimonial, index) => (
            <TrustCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
              totalCount={filtered.length}
              isHovered={hoveredCard === testimonial.id}
              onHover={setHoveredCard}
              onSkillClick={handleSkillClick}
              selectedSkill={selectedSkill}
            />
          ))}

          {/* Center indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 bg-accent rounded-full opacity-70 shadow-lg shadow-accent/20 flex items-center justify-center">
              <div className="w-3 h-3 bg-background rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Filtered Results Summary */}
        {selectedSkill && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} expert{filtered.length !== 1 ? 's' : ''} in{' '}
              <span className="font-medium text-foreground">{selectedSkill}</span>
            </p>
          </div>
        )}

        {/* Company Logos */}
        <div className="mt-16">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Trusted by leading companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale">
            {companyLogos.map((logo) => (
              <div key={logo.name} className="flex items-center justify-center">
                <div className="w-24 h-8 bg-foreground/20 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-foreground/60">{logo.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}