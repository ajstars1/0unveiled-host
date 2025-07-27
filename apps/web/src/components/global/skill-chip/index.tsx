// import { Star, StarHalf } from "lucide-react"
// import { cn } from "@/lib/utils"

// interface SkillChipProps {
//   skill: string
//   level?: number // 1-5
//   className?: string
// }

// const SkillChip = ({ skill, level = 0, className }: SkillChipProps) => {
//   const renderStars = () => {
//     const stars = []
//     const fullStars = Math.floor(level)
//     const hasHalfStar = level % 1 >= 0.5

//     for (let i = 0; i < fullStars; i++) {
//       stars.push(
//         <Star
//           key={`full-${i}`}
//           size={12}
//           className="fill-yellow-400 text-yellow-400"
//         />,
//       )
//     }

//     if (hasHalfStar) {
//       stars.push(<StarHalf key="half" size={12} className="text-yellow-400" />)
//     }

//     return stars
//   }

//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent-foreground transition-all hover:bg-accent/20",
//         className,
//       )}
//     >
//       {skill}
//       <span className="flex items-center gap-0.5">{renderStars()}</span>
//     </span>
//   )
// }

// export default SkillChip

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

interface SkillChipProps {
  skill: string
  className?: string
}

const SkillChip = ({ skill, className }: SkillChipProps) => {
  // For demonstration, showing random progress for each skill
  const progress = Math.floor(Math.random() * 40) + 60 // Random value between 60-100
//   const progress = Math.floor(Math.random() * 40) + 60 // Random value between 60-100

  return (
    <div
      className={cn(
        "flex flex-col space-y-2 bg-white/40 px-3 py-2 rounded-xl",
        className,
      )}
    >
      <span className="text-sm font-medium text-gray-700">{skill}</span>
      <div className="w-full">
        <Progress value={progress} className="h-2 bg-gray-200/70" />
      </div>
    </div>
  )
}

export default SkillChip