import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, Star } from "lucide-react"

interface SkillCardProps {
  skill: {
    name: string
    level: number
    projects: number
    endorsements: number
  }
}

function SkillCard({ skill }: SkillCardProps) {
  return (
    <Card className="">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold">{skill.name}</h3>
            <div className="text-sm text-muted-foreground">Expert Level</div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{skill.level}%</div>
            <div className="text-sm text-muted-foreground">Proficiency</div>
          </div>
        </div>
        <Progress value={skill.level} className="h-2 mb-4" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {skill.projects} projects
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1" />
            {skill.endorsements} endorsements
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SkillCard
