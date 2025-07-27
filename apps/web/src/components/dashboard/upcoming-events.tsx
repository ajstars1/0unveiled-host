"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

const events = [
  {
    id: "1",
    title: "Team Meeting",
    description: "Weekly sync for AI Recipe Generator",
    date: "2023-11-15",
    time: "10:00 AM",
  },
  {
    id: "2",
    title: "Frontend Workshop",
    description: "Learn about the latest React patterns",
    date: "2023-11-18",
    time: "2:00 PM",
  },
  {
    id: "3",
    title: "Project Deadline",
    description: "E-commerce Mobile App - Phase 1",
    date: "2023-11-30",
    time: "11:59 PM",
  },
]

export function UpcomingEvents() {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      weekday: "short",
    }
    return new Date(dateString).toLocaleDateString("en-US", options)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Upcoming Events
          </CardTitle>
          <Button variant="ghost" size="sm">
            View calendar
          </Button>
        </div>
        <CardDescription>Your scheduled events and deadlines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <p className="text-xs text-muted-foreground">{event.description}</p>
                </div>
                <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                  {formatDate(event.date)}
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {event.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
