"use client"

import { useState, useEffect } from 'react'
import { motion, useAnimation, useReducedMotion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, X, Filter } from 'lucide-react'

interface Testimonial {
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

const testimonials: Testimonial[] = [
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
  testimonial: Testimonial
  index: number
  isHovered: boolean
  onHover: (id: string | null) => void
  onSkillClick: (skill: string) => void
  selectedSkill: string | null
}

function TrustCard({ testimonial, index, isHovered, onHover, onSkillClick, selectedSkill }: TrustCardProps) {
  const controls = useAnimation()
  const reducedMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)

  const orbitRadius = 120 + (index * 30)
  const orbitDuration = 20 + (index * 5)

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
          initial={{ rotate: (360 / testimonials.length) * index }}
          onHoverStart={() => onHover(testimonial.id)}
          onHoverEnd={() => onHover(null)}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          whileTap={{ scale: 0.95 }}
        >
          <Card 
            className={`
              w-64 bg-primary text-primary-foreground cursor-pointer transition-all duration-300 
              ${shouldHighlight ? 'ring-2 ring-accent shadow-lg' : ''}
              ${selectedSkill && !shouldHighlight ? 'opacity-40' : ''}
            `}
            style={{
              transform: `translate(-50%, -${orbitRadius}px)`
            }}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-accent">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-medium">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{testimonial.name}</h3>
                  <p className="text-xs text-primary-foreground/70 truncate">{testimonial.role}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {testimonial.skills.slice(0, 3).map((skill) => (
                  <Badge 
                    key={skill}
                    variant="secondary"
                    className="text-xs px-2 py-0.5 cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSkillClick(skill)
                    }}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {testimonial.projects.slice(0, 2).map((project, idx) => (
                  <div key={idx} className="bg-primary-foreground/10 rounded-md p-2">
                    <div className="h-8 bg-primary-foreground/20 rounded mb-1"></div>
                    <p className="text-xs text-primary-foreground/70 truncate">{project.title}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-accent text-accent" />
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
  const reducedMotion = useReducedMotion()

  const allSkills = Array.from(new Set(testimonials.flatMap(t => t.skills)))
  const filteredTestimonials = selectedSkill 
    ? testimonials.filter(t => t.skills.includes(selectedSkill))
    : testimonials

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
          {allSkills.slice(0, 8).map((skill) => (
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
        <div className="relative mx-auto" style={{ height: '600px', maxWidth: '800px' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent rounded-full opacity-50"></div>
          
          {testimonials.map((testimonial, index) => (
            <TrustCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
              isHovered={hoveredCard === testimonial.id}
              onHover={setHoveredCard}
              onSkillClick={handleSkillClick}
              selectedSkill={selectedSkill}
            />
          ))}

          {/* Center indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-accent rounded-full opacity-60"></div>
          </div>
        </div>

        {/* Filtered Results Summary */}
        {selectedSkill && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTestimonials.length} expert{filteredTestimonials.length !== 1 ? 's' : ''} in{' '}
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