import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface AchievementCardProps {
  achievement: {
    title: string
    description: string
    icon: LucideIcon
    date: string
  }
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const Icon = achievement.icon

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{achievement.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">
              {achievement.description}
            </p>
            <div className="text-sm text-muted-foreground">
              Achieved in {achievement.date}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AchievementCard
