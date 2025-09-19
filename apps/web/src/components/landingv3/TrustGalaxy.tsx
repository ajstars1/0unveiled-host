"use client"

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Filter, Search } from 'lucide-react'

// --- INTERFACES AND MOCK DATA (Unchanged) ---
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

const fallbackItems: TrustItem[] = [
  // ... fallbackItems data remains the same
  {id:'1',name:'Sarah Chen',role:'Product Manager',company:'TechFlow',avatar:'/avatars/sarah.jpg',skills:['Product Strategy','User Research','Analytics'],projects:[{title:'Mobile App Redesign',thumbnail:'/projects/mobile.jpg'},{title:'Dashboard Analytics',thumbnail:'/projects/dashboard.jpg'}],quote:'Working with this team transformed our product development process. Their attention to detail and user-centric approach delivered exceptional results.',rating:5},{id:'2',name:'Marcus Rodriguez',role:'Engineering Lead',company:'DevCorp',avatar:'/avatars/marcus.jpg',skills:['React','Node.js','TypeScript'],projects:[{title:'E-commerce Platform',thumbnail:'/projects/ecommerce.jpg'},{title:'API Integration',thumbnail:'/projects/api.jpg'}],quote:'The technical expertise and collaborative approach made complex challenges feel manageable. Outstanding engineering partnership.',rating:5},{id:'3',name:'Emma Thompson',role:'Design Director',company:'CreativeStudio',avatar:'/avatars/emma.jpg',skills:['UI/UX Design','Figma','Design Systems'],projects:[{title:'Brand Identity',thumbnail:'/projects/brand.jpg'},{title:'Design System',thumbnail:'/projects/system.jpg'}],quote:'Incredible design thinking and execution. They brought our vision to life with pixel-perfect precision and thoughtful interactions.',rating:5},{id:'4',name:'David Kim',role:'Startup Founder',company:'InnovateLab',avatar:'/avatars/david.jpg',skills:['Strategy','Growth','MVP Development'],projects:[{title:'SaaS Platform',thumbnail:'/projects/saas.jpg'},{title:'Landing Page',thumbnail:'/projects/landing.jpg'}],quote:'From concept to launch, they guided us through every step. The MVP exceeded expectations and helped us secure Series A funding.',rating:5},{id:'5',name:'Lisa Park',role:'Marketing Head',company:'GrowthCo',avatar:'/avatars/lisa.jpg',skills:['Digital Marketing','SEO','Content Strategy'],projects:[{title:'Marketing Site',thumbnail:'/projects/marketing.jpg'},{title:'Campaign Landing',thumbnail:'/projects/campaign.jpg'}],quote:'The marketing website they built increased our conversion rate by 40%. Beautiful design meets performance optimization.',rating:5}
]

const companyLogos: CompanyLogo[] = [
  // ... companyLogos data remains the same
  {name:'TechFlow',logo:'/logos/techflow.svg'},{name:'DevCorp',logo:'/logos/devcorp.svg'},{name:'CreativeStudio',logo:'/logos/creative.svg'},{name:'InnovateLab',logo:'/logos/innovate.svg'},{name:'GrowthCo',logo:'/logos/growth.svg'},{name:'DataSync',logo:'/logos/datasync.svg'},{name:'CloudTech',logo:'/logos/cloud.svg'},{name:'FinanceApp',logo:'/logos/finance.svg'}
]


// --- PROPS FOR THE REFACTORED CARD ---
interface TrustCardProps {
  testimonial: TrustItem
  onSkillClick: (skill: string) => void
  selectedSkill: string | null
}


// --- REFACTORED TrustCard COMPONENT ---
// This component no longer handles its own animation logic, making it cleaner.
// Animation is now controlled by the parent grid for a more cohesive effect.
function TrustCard({ testimonial, onSkillClick, selectedSkill }: TrustCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shouldHighlight = selectedSkill ? testimonial.skills.includes(selectedSkill) : false

  // Variants for card entrance and exit animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          layout="position" // Enables smooth re-ordering when filtering
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          whileHover={{ scale: 1.03, y: -5 }} // Subtle hover effect
          whileTap={{ scale: 0.98 }}
          className="w-full h-full"
        >
          <Card 
            className={`
              w-full h-full flex flex-col bg-card text-card-foreground cursor-pointer transition-all duration-300
              ${shouldHighlight ? 'ring-2 ring-primary shadow-lg' : 'ring-1 ring-border'}
              ${selectedSkill && !shouldHighlight ? 'opacity-50 grayscale' : ''}
              hover:shadow-xl hover:ring-primary
            `}
          >
            <CardContent className="p-4 space-y-3 flex flex-col flex-grow">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-primary/20">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{testimonial.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5 flex-grow items-start">
                {testimonial.skills.slice(0, 2).map((skill) => (
                  <Badge 
                    key={skill}
                    variant="secondary"
                    className="text-xs px-2 py-0.5 cursor-pointer hover:bg-primary/80 hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSkillClick(skill)
                    }}
                  >
                    {skill}
                  </Badge>
                ))}
                {testimonial.skills.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{testimonial.skills.length - 2}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-0.5 mt-auto pt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        {/* ... Dialog content remains the same */}
        <DialogHeader><DialogTitle className="flex items-center gap-3"><Avatar className="h-12 w-12"><AvatarImage src={testimonial.avatar} alt={testimonial.name} /><AvatarFallback className="bg-accent text-accent-foreground font-medium">{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><h3 className="font-semibold">{testimonial.name}</h3><p className="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</p></div></DialogTitle></DialogHeader><div className="space-y-4"><blockquote className="text-lg italic border-l-4 border-accent pl-4">"{testimonial.quote}"</blockquote><div className="space-y-3"><h4 className="font-medium">Skills & Expertise</h4><div className="flex flex-wrap gap-2">{testimonial.skills.map((skill) => (<Badge key={skill} variant="outline" className="text-sm">{skill}</Badge>))}</div></div>{testimonial.projects && testimonial.projects.length > 0 && (<div className="space-y-3"><h4 className="font-medium">Featured Projects</h4><div className="grid grid-cols-2 gap-3">{testimonial.projects.map((project, idx) => (<div key={idx} className="bg-muted rounded-lg p-3"><div className="h-20 bg-muted-foreground/10 rounded mb-2"></div><p className="text-sm font-medium">{project.title}</p></div>))}</div></div>)}<div className="flex items-center gap-2"><span className="text-sm font-medium">Rating:</span><div className="flex items-center gap-1">{[...Array(testimonial.rating)].map((_, i) => (<Star key={i} className="h-4 w-4 fill-accent text-accent" />))}</div></div></div>
      </DialogContent>
    </Dialog>
  )
}


// --- REFACTORED TrustGalaxy (Now TrustGrid) COMPONENT ---
export default function TrustGalaxy() {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [items, setItems] = useState<TrustItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // NOTE: removed hoveredCard state, as it's no longer needed.
  // The useReducedMotion hook is respected by Framer Motion automatically.

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

  // Variants for the main grid container to stagger children animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Time delay between each child animating in
      },
    },
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Trusted by Innovation Leaders
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join a constellation of forward-thinking companies and creators who've transformed their ideas into reality.
          </p>
        </div>

        {/* --- Skill Filter (Unchanged) --- */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <Button
            variant={selectedSkill === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSkill(null)}
          >
            <Search className="h-4 w-4 mr-2" />
            Explore Profiles
          </Button>
          {allSkills.map((skill) => (
            <Button
              key={skill}
              variant={selectedSkill === skill ? "default" : "outline"}
              size="sm"
              onClick={() => handleSkillClick(skill)}
            >
              {skill}
            </Button>
          ))}
        </div>

        {/* --- Trust Grid (Replaces Trust Galaxy) --- */}
        <div className="relative mx-auto max-w-6xl">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Loading talent grid...</p>
              </div>
            </div>
          )}
          
          {error && !loading && (
             <div className="flex items-center justify-center min-h-[300px]">
              <div className="bg-destructive/10 p-4 rounded-lg text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
          
          {/* --- Animated Grid Container --- */}
          {!loading && !error && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {filtered.map((testimonial) => (
                  <TrustCard
                    key={testimonial.id}
                    testimonial={testimonial}
                    onSkillClick={handleSkillClick}
                    selectedSkill={selectedSkill}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* --- Filtered Results Summary (Unchanged) --- */}
        {selectedSkill && (
          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} expert{filtered.length !== 1 ? 's' : ''} in{' '}
              <span className="font-medium text-foreground">{selectedSkill}</span>
            </p>
          </div>
        )}

        {/* --- Company Logos (Unchanged) --- */}
        <div className="mt-20">
          <p className="text-center text-sm text-muted-foreground mb-8">
            Powering projects for leading companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-70 grayscale">
            {companyLogos.map((logo) => (
              <div key={logo.name} className="flex items-center justify-center" title={logo.name}>
                 <div className="w-28 h-9 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs font-semibold text-muted-foreground">{logo.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}