"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, ChevronRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

const steps = [
  { id: 1, name: "Profile" },
  { id: 2, name: "Skills" },
  { id: 3, name: "Interests" },
  { id: 4, name: "Complete" },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleNext = () => {
    if (currentStep < steps.length) {
      setIsLoading(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsLoading(false)
      }, 500)
    } else {
      // Complete onboarding
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        toast({
          title: "Onboarding complete",
          description: "Your profile is now set up. Redirecting to profile edit page...",
        })
        // Redirect to profile edit page
        window.location.href = "/profile/edit"
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-neutral-950 to-neutral-900">
      <div className="container mx-auto py-12 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Logo and title */}
          <div className="text-center mb-8">
            <Image src="/logo/logo.gif" alt="0Unveiled Logo" width={80} height={80} className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white">Let&apos;s set up your profile</h1>
            <p className="text-gray-300 mt-2">Complete these steps to get the most out of 0Unveiled</p>
          </div>

          {/* Progress steps */}
          <div className="mb-8">
            <nav aria-label="Progress">
              <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className={`relative ${stepIdx === steps.length - 1 ? "flex-1" : "flex-1"}`}>
                    {step.id < currentStep ? (
                      <div className="group flex items-center">
                        <span className="shrink-0 h-10 w-10 flex items-center justify-center bg-primary rounded-full">
                          <Check className="h-5 w-5 text-white" aria-hidden="true" />
                        </span>
                        <span className="ml-3 text-sm font-medium text-white">{step.name}</span>
                      </div>
                    ) : step.id === currentStep ? (
                      <div className="flex items-center" aria-current="step">
                        <span className="shrink-0 h-10 w-10 flex items-center justify-center border-2 border-primary rounded-full">
                          <span className="text-primary">{step.id}</span>
                        </span>
                        <span className="ml-3 text-sm font-medium text-white">{step.name}</span>
                      </div>
                    ) : (
                      <div className="group flex items-center">
                        <span className="shrink-0 h-10 w-10 flex items-center justify-center border-2 border-gray-600 rounded-full">
                          <span className="text-gray-400">{step.id}</span>
                        </span>
                        <span className="ml-3 text-sm font-medium text-gray-400">{step.name}</span>
                      </div>
                    )}

                    {stepIdx !== steps.length - 1 && (
                      <div
                        className={`hidden md:block absolute top-5 right-0 w-full h-0.5 ${step.id < currentStep ? "bg-primary" : "bg-gray-600"}`}
                      />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Step content */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Complete your profile</h2>
                <p className="text-gray-500">This information will be displayed on your public profile.</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">Photo</span>
                    </div>
                    <Button size="default" className="bg-white text-black hover:bg-gray-100" variant="outline">Upload</Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="display-name">Display Name</Label>
                    <Input type="text" id="display-name" placeholder="How you want to be known on the platform" className="mt-1" />
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="headline">Headline</Label>
                    <Input type="text" id="headline" placeholder="e.g., Full Stack Developer | AI Enthusiast" className="mt-1" />
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself, your background, and what you're looking to achieve"
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Add your skills</h2>
                <p className="text-gray-500">Select skills that best represent your abilities.</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="" htmlFor="primary-skill">Primary Skill Category</Label>
                    <Select>
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="">
                        <SelectItem className="" value="development">Software Development</SelectItem>
                        <SelectItem className="" value="design">Design</SelectItem>
                        <SelectItem className="" value="data">Data Science</SelectItem>
                        <SelectItem className="" value="marketing">Marketing</SelectItem>
                        <SelectItem className="" value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="technical-skills">Technical Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {["JavaScript", "React", "Node.js", "Python", "UI/UX", "Data Analysis"].map((skill) => (
                        <Button size="default" key={skill} variant="outline" className="rounded-full">
                          {skill}
                        </Button>
                      ))}
                      <Button size="default" variant="outline" className="rounded-full">
                        + Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="soft-skills">Soft Skills</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Communication", "Teamwork", "Problem Solving", "Leadership"].map((skill) => (
                        <Button size="default" key={skill} variant="outline" className="rounded-full">
                          {skill}
                        </Button>
                      ))}
                      <Button size="default" variant="outline" className="rounded-full">
                        + Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="experience">Years of Experience</Label>
                    <Select>
                      <SelectTrigger className="">
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent className="">
                        <SelectItem className="" value="student">Student</SelectItem>
                        <SelectItem className="" value="0-1">0-1 years</SelectItem>
                        <SelectItem className="" value="1-3">1-3 years</SelectItem>
                        <SelectItem className="" value="3-5">3-5 years</SelectItem>
                        <SelectItem className="" value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Your interests</h2>
                <p className="text-gray-500">Tell us what kind of projects you&apos;re interested in.</p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="" htmlFor="project-interests">Project Interests</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Web Development",
                        "Mobile Apps",
                        "AI/ML",
                        "Data Visualization",
                        "UI Design",
                        "Game Development",
                      ].map((interest) => (
                        <Button size="default" key={interest} variant="outline" className="rounded-full">
                          {interest}
                        </Button>
                      ))}
                      <Button size="default" variant="outline" className="rounded-full">
                        + Add
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="goals">Your Goals</Label>
                    <Select>
                      <SelectTrigger className="">
                        <SelectValue placeholder="What are you looking to achieve?" />
                      </SelectTrigger>
                      <SelectContent className="">
                        <SelectItem className=""  value="learn">Learn new skills</SelectItem>
                        <SelectItem className="" value="portfolio">Build portfolio</SelectItem>
                        <SelectItem className="" value="network">Network with others</SelectItem>
                        <SelectItem className="" value="job">Find job opportunities</SelectItem>
                        <SelectItem className="" value="collaborate">Collaborate on projects</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="availability">Availability</Label>
                    <Select>
                      <SelectTrigger className="">
                        <SelectValue placeholder="How much time can you commit?" />
                      </SelectTrigger>
                      <SelectContent className="">
                        <SelectItem className="" value="few-hours">A few hours per week</SelectItem>
                        <SelectItem className="" value="part-time">Part-time (10-20 hours)</SelectItem>
                        <SelectItem className="" value="full-time">Full-time</SelectItem>
                        <SelectItem className="" value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="" htmlFor="preferred-role">Preferred Role in Projects</Label>
                    <Textarea
                      id="preferred-role"
                      placeholder="Describe what role you'd like to play in collaborative projects"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 text-center">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-12 w-12 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
                <p className="text-gray-500">
                  Your profile is now complete. You&apos;re ready to start exploring projects and connecting with others.
                </p>

                <div className="pt-4">
                  <Image
                    src="/onboarding-complete.png"
                    alt="Onboarding Complete"
                    width={300}
                    height={200}
                    className="mx-auto"
                  />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex justify-end">
              <Button size="default" variant="default" className="bg-black text-white hover:bg-gray-800" onClick={handleNext} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentStep === steps.length ? (
                  "Go to Dashboard"
                ) : (
                  <>
                    Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
