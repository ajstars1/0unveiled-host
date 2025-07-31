import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectProp } from "@/data/projects" // Assuming ProjectProp includes needed fields
import { cn } from "@/lib/utils"
import { projectStatusEnum } from "@0unveiled/database/schema"

interface ProjectCardProps {
  project: ProjectProp
}

// Helper to get status styling (similar to detail page)
const getStatusClass = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING: return "bg-blue-100 text-blue-800 border-blue-300";
      case ProjectStatus.ACTIVE: return "bg-green-100 text-green-800 border-green-300";
      case ProjectStatus.ON_HOLD: return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case ProjectStatus.COMPLETED: return "bg-purple-100 text-purple-800 border-purple-300";
      case ProjectStatus.ARCHIVED: return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Limit summary length for card display
  const truncatedSummary = project.publicSummary.length > 120
    ? project.publicSummary.substring(0, 120) + "..."
    : project.publicSummary

  // Limit skills shown for brevity
  const skillsToShow = project.requiredSkills.slice(0, 3)

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-shadow hover:shadow-md dark:hover:shadow-primary/20">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-lg font-semibold leading-tight">
             <Link href={`/project/${project.id}`} className="hover:underline">
                {project.title}
            </Link>
          </CardTitle>
           <Badge variant="outline" className={`text-xs capitalize ${getStatusClass(project.status)}`}>
               {project.status.toLowerCase().replace(/_/g, ' ')}
            </Badge>
        </div>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
          {project.owner.username !== 'seed_user_1746410303039' ? (
            <>
          <Avatar className="h-4 w-4">
            <AvatarImage src={project.owner.profilePicture || undefined} alt={project.owner.username || 'Owner'} />
            <AvatarFallback className="text-[8px]">{project.owner.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
           By
          <Link href={`/${project.owner.username}`} className="hover:underline font-medium text-foreground">
             {project.owner.username || 'Unknown User'}
              </Link>
            </>
          ) : (
            <span className="text-xs italic text-muted-foreground">Admin</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 grow">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{truncatedSummary}</p>
        <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Key Skills:</p>
            <div className="flex flex-wrap gap-1.5">
                {skillsToShow.length > 0 ? (
                    skillsToShow.map((skill) => (
                    <Badge key={skill.id} variant="secondary" className="text-xs">
                        {skill.name}
                    </Badge>
                    ))
                ) : (
                    <span className="text-xs italic text-muted-foreground">No skills specified.</span>
                )}
                {project.requiredSkills.length > skillsToShow.length && (
                    <Badge variant="outline" className="text-xs">+{project.requiredSkills.length - skillsToShow.length} more</Badge>
                )}
            </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/project/${project.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 