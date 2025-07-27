import { Clock } from "lucide-react"

const TimeAgo = ({
  updatedAt,
  icon = true,
}: {
  updatedAt: Date
  icon?: boolean
}) => {
  const now = Date.now()
  const diffInMinutes = Math.floor((now - updatedAt.getTime()) / 60000)

  const timeString = () => {
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hour ago`
    } else if (diffInMinutes < 525600) {
      return `${Math.floor(diffInMinutes / 1440)} day ago`
    } else {
      return `${Math.floor(diffInMinutes / 525600)} year ago`
    }
  }

  return (
    <div className="flex items-center ml-auto">
      {icon && <Clock className="h-4 w-4 mr-1" />}
      {timeString()}
    </div>
  )
}

export default TimeAgo
