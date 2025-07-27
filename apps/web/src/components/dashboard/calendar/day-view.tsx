"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface CalendarEvent {
  id: string
  title: string
  description: string
  project: string
  start: Date
  end: Date
  allDay: boolean
  type: "meeting" | "task" | "deadline" | "milestone"
}

interface DayViewProps {
  events: CalendarEvent[]
  date: Date
}

export function DayView({ events, date }: DayViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filter events for the selected day
  const dayEvents = events.filter((event) => {
    const eventDate = new Date(event.start)
    return eventDate.toDateString() === date.toDateString()
  })

  // All-day events
  const allDayEvents = dayEvents.filter((event) => event.allDay)

  // Time-specific events
  const timeEvents = dayEvents.filter((event) => !event.allDay)

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

  // Create time slots for the day
  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8 // Start at 8 AM
    return {
      time: `${hour % 12 === 0 ? 12 : hour % 12}${hour < 12 ? "am" : "pm"}`,
      hour,
      events: timeEvents.filter((event) => event.start.getHours() === hour),
    }
  })

  return (
    <>
      <div className="mb-4 sm:mb-6">
        <h3 className="font-medium mb-2 text-sm sm:text-base">All-day Events</h3>
        {allDayEvents.length > 0 ? (
          <div className="space-y-1 sm:space-y-2">
            {allDayEvents.map((event) => (
              <Badge
                variant="default"
                key={event.id}
                className={cn(
                  "w-full justify-start font-normal text-xs sm:text-sm cursor-pointer py-1.5 sm:py-2",
                  getEventBadgeColor(event.type),
                )}
                onClick={() => handleEventClick(event)}
              >
                {event.title}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No all-day events scheduled</p>
        )}
      </div>

      <div className="space-y-0.5 sm:space-y-1">
        {timeSlots.map((slot) => (
          <div key={slot.time} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-1 sm:gap-2">
            <div className="text-[10px] sm:text-sm text-muted-foreground text-right pt-1 sm:pt-2">{slot.time}</div>
            <Card className="p-1 sm:p-2 min-h-[40px] sm:min-h-[60px]">
              {slot.events.length > 0 ? (
                <div className="space-y-0.5 sm:space-y-1">
                  {slot.events.map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-1 sm:p-2 rounded-md cursor-pointer text-[10px] sm:text-xs",
                        getEventBadgeColor(event.type)
                      )}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="font-medium text-xs sm:text-sm">{event.title}</div>
                      <div className="text-[9px] sm:text-xs">
                        {event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                        {event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Card>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="">
            <DialogTitle className="">{selectedEvent?.title}</DialogTitle>
            <DialogDescription className="">{selectedEvent?.project}</DialogDescription>
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
                <Badge variant="default" className={getEventBadgeColor(selectedEvent?.type ?? "")}>
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
