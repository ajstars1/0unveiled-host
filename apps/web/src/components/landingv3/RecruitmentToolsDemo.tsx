"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useAnimationControls, useMotionValue } from "framer-motion"
import { Play, Pause, Search, MapPin, Star, Zap, Users, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface Candidate {
  id: string
  name: string
  role: string
  score: number
  skills: string[]
  location: string
  topSkill: string
  avatar: string
}

const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Senior Frontend Developer",
    score: 92,
    skills: ["React", "TypeScript", "Node.js"],
    location: "San Francisco",
    topSkill: "React",
    avatar: "SC"
  },
  {
    id: "2",
    name: "Marcus Johnson",
    role: "Full Stack Engineer",
    score: 88,
    skills: ["Python", "Django", "PostgreSQL"],
    location: "New York",
    topSkill: "Python",
    avatar: "MJ"
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    role: "UX Designer",
    score: 95,
    skills: ["Figma", "User Research", "Prototyping"],
    location: "Austin",
    topSkill: "Figma",
    avatar: "ER"
  },
  {
    id: "4",
    name: "David Kim",
    role: "DevOps Engineer",
    score: 89,
    skills: ["AWS", "Docker", "Kubernetes"],
    location: "Seattle",
    topSkill: "AWS",
    avatar: "DK"
  },
  {
    id: "5",
    name: "Priya Patel",
    role: "Data Scientist",
    score: 93,
    skills: ["Machine Learning", "Python", "TensorFlow"],
    location: "Boston",
    topSkill: "Machine Learning",
    avatar: "PP"
  },
  {
    id: "6",
    name: "Alex Thompson",
    role: "Backend Developer",
    score: 86,
    skills: ["Java", "Spring Boot", "MySQL"],
    location: "Chicago",
    topSkill: "Java",
    avatar: "AT"
  }
]

const availableSkills = ["React", "TypeScript", "Node.js", "Python", "Django", "PostgreSQL", "Figma", "User Research", "Prototyping", "AWS", "Docker", "Kubernetes", "Machine Learning", "TensorFlow", "Java", "Spring Boot", "MySQL"]
const availableLocations = ["San Francisco", "New York", "Austin", "Seattle", "Boston", "Chicago"]

export default function RecruitmentToolsDemo() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [minScore, setMinScore] = useState([70])
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentHighlight, setCurrentHighlight] = useState<string | null>(null)
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [roleData, setRoleData] = useState({ title: "", skills: "", minScore: 80 })
  const [showConfirmation, setShowConfirmation] = useState(false)

  const magnifierControls = useAnimationControls()
  const gridRef = useRef<HTMLDivElement>(null)
  const magnifierX = useMotionValue(0)
  const magnifierY = useMotionValue(0)

  const filteredCandidates = mockCandidates.filter(candidate => {
    const skillMatch = selectedSkills.length === 0 || selectedSkills.some(skill => 
      candidate.skills.includes(skill)
    )
    const scoreMatch = candidate.score >= minScore[0]
    const locationMatch = selectedLocation === "all" || candidate.location === selectedLocation
    
    return skillMatch && scoreMatch && locationMatch
  })

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  const startAnimation = async () => {
    if (!gridRef.current) return

    const cards = Array.from(gridRef.current.querySelectorAll('[data-candidate-id]'))
    const cardPositions = cards.map(card => {
      const rect = card.getBoundingClientRect()
      const gridRect = gridRef.current!.getBoundingClientRect()
      return {
        x: rect.left - gridRect.left + rect.width / 2,
        y: rect.top - gridRect.top + rect.height / 2,
        id: card.getAttribute('data-candidate-id')
      }
    })

    for (const position of cardPositions) {
      if (!isPlaying) break
      
      await magnifierControls.start({
        x: position.x - 24,
        y: position.y - 24,
        transition: { duration: 0.8, ease: "easeInOut" }
      })

      if (position.id && filteredCandidates.some(c => c.id === position.id)) {
        setCurrentHighlight(position.id)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setCurrentHighlight(null)
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    setIsPlaying(false)
  }

  useEffect(() => {
    if (isPlaying) {
      startAnimation()
    }
  }, [isPlaying])

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying)
  }

  const handleRequestIntro = (candidateName: string) => {
    toast.success(`Intro request sent to ${candidateName}`, {
      description: "They'll be notified of your interest"
    })
  }

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleData.title.trim()) return

    toast.success("Role posted successfully!", {
      description: "Your job posting is now live and visible to candidates"
    })
    
    setShowRoleForm(false)
    setShowConfirmation(true)
    setRoleData({ title: "", skills: "", minScore: 80 })
    
    setTimeout(() => setShowConfirmation(false), 3000)
  }

  return (
    <div className="w-full bg-card">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-heading font-bold mb-3">
            AI-Powered Recruitment Tools
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover, filter, and connect with top talent using intelligent matching algorithms
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Demo Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading font-semibold">Candidate Pool</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayToggle}
                  className="gap-2"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Demo AI Scanner"}
                </Button>
              </div>
            </div>

            <div ref={gridRef} className="relative">
              {/* AI Magnifier */}
              <motion.div
                className="absolute z-10 pointer-events-none"
                animate={magnifierControls}
                initial={{ x: 0, y: 0 }}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary border-4 border-accent flex items-center justify-center shadow-lg">
                    <Search className="w-5 h-5 text-primary-foreground" />
                  </div>
                  {isPlaying && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-accent/20 border-2 border-accent"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.3, 1]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Candidate Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCandidates.map((candidate) => (
                  <motion.div
                    key={candidate.id}
                    data-candidate-id={candidate.id}
                    className="relative"
                    animate={currentHighlight === candidate.id ? { scale: 1.05 } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`relative overflow-hidden transition-all duration-300 ${
                      currentHighlight === candidate.id ? 'ring-2 ring-accent shadow-lg' : 'hover:shadow-md'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                              {candidate.avatar}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">{candidate.name}</h4>
                              <p className="text-xs text-muted-foreground">{candidate.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium">{candidate.score}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {candidate.location}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge variant="secondary" className="text-xs px-2 py-0.5">
                            <Zap className="w-3 h-3 mr-1" />
                            {candidate.topSkill}
                          </Badge>
                          {candidate.skills.slice(1, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs px-2 py-0.5">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {currentHighlight === candidate.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-0 bg-primary/95 flex items-center justify-center p-4"
                          >
                            <div className="text-center">
                              <div className="text-primary-foreground mb-3">
                                <Users className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm font-medium">Match Found!</p>
                                <p className="text-xs opacity-90">{candidate.score}% compatibility</p>
                              </div>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleRequestIntro(candidate.name)}
                                className="text-xs"
                              >
                                Request Intro
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredCandidates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">No candidates match your filters</p>
                  <p className="text-sm">Try adjusting your criteria to see more results</p>
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Smart Filters
                </h3>

                <div className="space-y-6">
                  {/* Skills Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Required Skills</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSkills.slice(0, 8).map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={skill}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={() => handleSkillToggle(skill)}
                          />
                          <Label 
                            htmlFor={skill} 
                            className="text-xs cursor-pointer"
                          >
                            {skill}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Minimum Score: {minScore[0]}
                    </Label>
                    <Slider
                      value={minScore}
                      onValueChange={setMinScore}
                      max={100}
                      min={50}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  {/* Location Filter */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Location</Label>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any location</SelectItem>
                        {availableLocations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Post Role CTA */}
            <Card>
              <CardContent className="p-6">
                {!showRoleForm ? (
                  <div>
                    <h3 className="font-heading font-semibold mb-2 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Need to hire?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Post a role and let AI find the perfect candidates for you
                    </p>
                    <Button 
                      onClick={() => setShowRoleForm(true)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Post a Role
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleRoleSubmit} className="space-y-4">
                    <h3 className="font-heading font-semibold mb-4">Post New Role</h3>
                    
                    <div>
                      <Label htmlFor="role-title" className="text-sm font-medium">Job Title</Label>
                      <Input
                        id="role-title"
                        value={roleData.title}
                        onChange={(e) => setRoleData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Senior React Developer"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="role-skills" className="text-sm font-medium">Required Skills</Label>
                      <Input
                        id="role-skills"
                        value={roleData.skills}
                        onChange={(e) => setRoleData(prev => ({ ...prev, skills: e.target.value }))}
                        placeholder="React, TypeScript, Node.js"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Minimum Score: {roleData.minScore}
                      </Label>
                      <Slider
                        value={[roleData.minScore]}
                        onValueChange={(value) => setRoleData(prev => ({ ...prev, minScore: value[0] }))}
                        max={100}
                        min={60}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" className="flex-1" disabled={!roleData.title.trim()}>
                        Post Role
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowRoleForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}

                {showConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-md text-center"
                  >
                    <p className="text-sm font-medium text-accent-foreground">
                      ✨ Role posted successfully!
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Matching candidates will be notified
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-semibold mb-4">Pool Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Candidates</span>
                    <span className="font-medium">{mockCandidates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Filtered Results</span>
                    <span className="font-medium">{filteredCandidates.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Score</span>
                    <span className="font-medium">
                      {filteredCandidates.length > 0 
                        ? Math.round(filteredCandidates.reduce((sum, c) => sum + c.score, 0) / filteredCandidates.length)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}