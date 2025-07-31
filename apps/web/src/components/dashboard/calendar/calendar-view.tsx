"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TaskStatus } from "@0unveiled/database/schema"

export interface CalendarEvent {
  id: string
  title: string
  description: string
  project: string
  start: Date
  end: Date
  allDay: boolean
  type: "meeting" | "task" | "deadline" | "milestone"
  status: TaskStatus
  assignee: string | undefined
}

interface CalendarViewProps {
  events: CalendarEvent[]
  month: Date
}

export function CalendarView({ events, month }: CalendarViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Get days in month
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

  // Get first day of month
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1).getDay()

  // Create calendar days array
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    return {
      date,
      isCurrentMonth: day > 0 && day <= daysInMonth,
      isToday: new Date().toDateString() === date.toDateString(),
      events: events.filter((event) => {
        const eventDate = new Date(event.start)
        return eventDate.toDateString() === date.toDateString()
      }),
    }
  })

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300"
      case "task":
        return "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
      case "deadline":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300"
      case "milestone":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300"
      default:
        return ""
    }
  }

  return (
    <>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <div key={day} className="h-10 flex items-center justify-center font-medium text-xs sm:text-sm">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substring(0,1)}</span>
          </div>
        ))}
        {days.map((day, i) => (
          <Card
            key={i}
            className={cn(
              "min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 overflow-hidden",
              !day.isCurrentMonth && "bg-muted/50",
              day.isToday && "border-primary",
            )}
          >
            <div className="text-xs sm:text-sm font-medium mb-1 text-center sm:text-left">{day.date.getDate()}</div>
            <div className="space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px]">
              {day.events.map((event) => (
                <Badge
                  key={event.id}
                  className={cn(
                    "w-full justify-start font-normal text-[10px] sm:text-xs cursor-pointer truncate p-1 sm:p-1",
                    getEventBadgeColor(event.type),
                  )}
                  onClick={() => handleEventClick(event)}
                >
                  {event.title}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>{selectedEvent?.project}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>{selectedEvent?.description}</p>
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Start:</span>
                <span>
                  {selectedEvent?.start.toLocaleDateString()}
                  {!selectedEvent?.allDay &&
                    ` ${selectedEvent?.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">End:</span>
                <span>
                  {selectedEvent?.end.toLocaleDateString()}
                  {!selectedEvent?.allDay &&
                    ` ${selectedEvent?.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Type:</span>
                <Badge className={getEventBadgeColor(selectedEvent?.type ?? "")}>
                  {selectedEvent?.type ? selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1) : ""}
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
