"use client"

import { X } from "lucide-react"

interface SkillTagProps {
  name: string
  category?: string
  onRemove?: () => void
  className?: string
}

export default function SkillTag({ name, category, onRemove, className = "" }: SkillTagProps) {
  return (
    <div className={`flex items-center bg-gray-100 rounded-full px-3 py-1 ${className}`}>
      <span className="mr-1">{name}</span>
      {category && <span className="text-xs text-gray-500 mr-1">({category})</span>}
      {onRemove && (
        <button onClick={onRemove} className="text-gray-500 hover:text-red-500" aria-label={`Remove ${name} skill`}>
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
