"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search, PlusCircle, Plus, ChevronDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import NotFoundComp from "@/components/global/not-found"
import { ProjectProp } from "@/data/projects" 
import ProjectCard from "./ProjectCard" // Use relative path
import { ProjectCardSkeleton } from "./ProjectCardSkeleton" // Use relative path
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ProjectsClientPageProps {
    initialProjects: ProjectProp[] | null;
}

export default function ProjectsClientPage({ initialProjects }: ProjectsClientPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All") // State for filter tabs

  // Determine filter categories based on project skills
  const filterCategories = useMemo(() => {
    const categories = new Set<string>(["All"]) 
    initialProjects?.forEach((project) => {
      project.requiredSkills?.forEach((skill) => {
        if (skill.category) categories.add(skill.category)
      })
      project.roles?.forEach((role) => { // Also consider skills from roles
         role.requiredSkills?.forEach((skill) => {
            if (skill.category) categories.add(skill.category)
         })
      })
    })
    return Array.from(categories).slice(0, 6) // Limit categories shown
  }, [initialProjects])

  // Filter projects based on search query and selected category
  const filteredProjects = useMemo(() => {
    if (!initialProjects) return []

    return initialProjects
      .filter((project) => {
        const searchLower = searchQuery.toLowerCase()
        // Search logic: check title, summary, owner username, skills, role titles/skills
        const matchesSearch = searchQuery === "" ||
          project.title.toLowerCase().includes(searchLower) ||
          project.publicSummary.toLowerCase().includes(searchLower) || 
          project.owner.username?.toLowerCase().includes(searchLower) ||
          project.requiredSkills.some((skill) => 
            skill.name.toLowerCase().includes(searchLower)
          ) ||
          project.roles.some((role) => 
             role.title.toLowerCase().includes(searchLower) ||
             role.requiredSkills.some(skill => skill.name.toLowerCase().includes(searchLower))
          )
        
        // Category filtering logic
        const matchesCategory = selectedCategory === "All" ||
          project.requiredSkills.some((s) => s.category === selectedCategory) ||
          project.roles.some((role) => 
             role.requiredSkills.some(s => s.category === selectedCategory)
          )

        return matchesSearch && matchesCategory
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}, [searchQuery, selectedCategory, initialProjects]);

  // Loading state is determined by whether initialProjects is null (or an explicit loading prop if passed)
  const isLoading = initialProjects === null; // Example: treat null as loading, adjust if needed

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore Projects</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Discover innovative projects, collaborate with others, and showcase your skills.
        </p>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-center items-center gap-2 w-full max-w-xl mx-auto">
           <div className="relative grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, summary, owner, or skills..."
                className="pl-10 h-10 rounded-full bg-muted border-transparent focus:border-primary focus:bg-background focus:ring-0 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <Link 
              href="/project/create" 
              title="Create New Project" 
              className="group shrink-0"
           >
              <Button 
                 variant="outline" 
                 className="rounded-full p-2 transition-all duration-700 ease-out hover:pl-3 hover:pr-4 group-hover:w-auto border-slate-300 border-2"
              >
                 <Plus className="h-5 w-5 shrink-0" />
                 <span className="ml-0 w-0 opacity-0 group-hover:ml-2 group-hover:w-auto group-hover:opacity-100 group-hover:delay-200 overflow-hidden transition-all duration-500 ease-out delay-200 whitespace-nowrap">
                    Create Project
                 </span>
              </Button>
           </Link>
        </div>

        {filterCategories.length > 1 && (
          <div className="flex justify-center w-full">
            {/* Tabs for larger screens */}
            <Tabs
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="hidden sm:block"
            >
              <TabsList className="bg-muted p-1 rounded-full inline-flex max-w-full overflow-hidden">
                {filterCategories.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="text-sm px-4 py-1.5 rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Dropdown for smaller screens */}
            <div className="sm:hidden w-full max-w-xs mx-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between rounded-full">
                    {selectedCategory}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-(--radix-dropdown-menu-trigger-width)">
                  {filterCategories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onSelect={() => setSelectedCategory(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {isLoading && ( // Show skeletons if loading (could also check prop)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <ProjectCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && (
        <>
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <NotFoundComp
              icon="project" // Use a relevant icon like 'project'
              title="Projects"
              description="No projects match your current search and filter criteria."
            />
          )}
        </>
      )}
    </div>
  )
}