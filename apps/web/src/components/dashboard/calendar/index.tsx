"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/dashboard/calendar/date-picker"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { CalendarView, type CalendarEvent } from "@/components/dashboard/calendar/calendar-view"
import { WeekView } from "@/components/dashboard/calendar/week-view"
import { DayView } from "@/components/dashboard/calendar/day-view"
import { taskStatusEnum, type Task } from "@0unveiled/database/schema"
import { isSameDay, addDays, subDays, addWeeks, subWeeks } from 'date-fns'

// Define the prop type for the fetched tasks
type FetchedTask = Awaited<ReturnType<typeof import("@/data/tasks").getAllProjectTasksForUser>> extends (infer U)[] | null ? U : never;

interface CalendarProps {
    fetchedTasks: FetchedTask[];
    currentProjectId?: string; // Optional: ID of the current project context
    currentProjectTitle?: string; // Optional: Title of the current project context
}

export default function Calendar({ fetchedTasks, currentProjectId, currentProjectTitle }: CalendarProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [month, setMonth] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<string>("month"); // Track active tab
  
  // TODO: Add state for filters (project, type)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<CalendarEvent['type'] | 'all'>('all');

  // Transform fetchedTasks into CalendarEvent[] and apply filters
  const events: CalendarEvent[] = useMemo(() => {
     if (!fetchedTasks) return []; // Handle null case
     return fetchedTasks
       .filter(task => !!task.dueDate) // Ensure task has a due date
       .map(task => {
            const dueDate = task.dueDate as Date; // Cast is safe due to filter
            // Determine the event type based on task status or other logic
            // Example: If it's done, it's a 'task', otherwise it's a 'deadline'
            // This logic can be expanded (e.g., check for specific tags, etc.)
            const type: CalendarEvent['type'] = task.status === "DONE" ? 'task' : 'deadline'; 
            
            return {
                id: task.id,
                title: task.title,
                description: task.description || '',
                project: task.project.title, 
                start: dueDate, 
                end: dueDate,
                allDay: true, // Assume tasks/deadlines are all-day
                type: type, 
                // Pass additional relevant data if needed by views
                status: task.status,
                assignee: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : undefined // Use undefined if no assignee
            } satisfies CalendarEvent; // Use satisfies for type checking the object literal
        })
       .filter(event => selectedProjectId === 'all' || event.project === selectedProjectId) 
       .filter(event => selectedEventType === 'all' || event.type === selectedEventType); 
  }, [fetchedTasks, selectedProjectId, selectedEventType]);
  
  // Get unique project titles for the filter dropdown
  const projectTitles = useMemo(() => {
      // Only calculate if not in a specific project context
      if (currentProjectId || !fetchedTasks) return []; 
      const titles = new Set(fetchedTasks.map(task => task.project.title));
      return Array.from(titles);
  }, [fetchedTasks, currentProjectId]);

  // --- Handlers --- 
  const handlePreviousMonth = () => {
    setMonth(subWeeks(month, 4)); // Approx month change
  }

  const handleNextMonth = () => {
    setMonth(addWeeks(month, 4)); // Approx month change
  }

  const handlePreviousWeek = () => {
    setDate(subWeeks(date, 1));
  }

  const handleNextWeek = () => {
    setDate(addWeeks(date, 1));
  }

  const handlePreviousDay = () => {
    setDate(subDays(date, 1));
  }

  const handleNextDay = () => {
    setDate(addDays(date, 1));
  }
  
  // TODO: Implement event creation logic in the Dialog

  return (
    // Add overflow-x-auto for smaller screens to prevent layout breakage
    <div className="space-y-6 overflow-x-auto">
       {/* Header and Add Event Button */}
       <div className="flex items-center justify-between">
         {/* Removed h1 - handled by DashboardHeader in page.tsx */}
              <h1 className="text-2xl font-bold tracking-tight"> Calendar - <Link href={`/dashboard/projects/${currentProjectId}`} className=" text-2xl text-muted-foreground">
              {currentProjectTitle}
              </Link></h1>
         <div></div> {/* Placeholder to keep button pushed right if header removed */}
         <Dialog> 
           {/* ... existing Dialog code ... */}
          <DialogTrigger asChild>
            <Button size="default" variant="default" className="">
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="">
              <DialogTitle className="">Add New Event</DialogTitle>
              <DialogDescription className="">Create a new event or task on your calendar.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="" htmlFor="title">Title</Label>
                <Input type="text" className="" id="title" placeholder="Event title" />
              </div>
              <div className="grid gap-2">
                <Label className="" htmlFor="description">Description</Label>
                <Textarea rows={3} className="" id="description" placeholder="Event description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="" htmlFor="start-date">Start Date</Label>
                  <DatePicker />
                </div>
                <div className="grid gap-2">
                  <Label className="" htmlFor="end-date">End Date</Label>
                  <DatePicker />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="" htmlFor="project">Project</Label>
                {/* Populate project select dynamically */}
                <Select 
                    defaultValue={currentProjectTitle} // Set default if in project context
                    disabled={!!currentProjectId} // Disable if in project context
                >
                  <SelectTrigger className="" id="project">
                    <SelectValue placeholder={currentProjectTitle || "Select project"} />
                  </SelectTrigger>
                  <SelectContent className="">
                     {/* Only show options if not disabled */}
                     {!currentProjectId && projectTitles.map(title => (
                         <SelectItem className="" key={title} value={title}>{title}</SelectItem>
                     ))}
                     {/* Show the current project if disabled */}
                     {currentProjectId && currentProjectTitle && (
                         <SelectItem className="" value={currentProjectTitle} disabled>{currentProjectTitle}</SelectItem>
                     )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="" htmlFor="type">Event Type</Label>
                <Select defaultValue="task">
                  <SelectTrigger className="" id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="">
                    <SelectItem className="" value="task">Task</SelectItem>
                    <SelectItem className="" value="meeting">Meeting</SelectItem>
                    <SelectItem className="" value="deadline">Deadline</SelectItem>
                    <SelectItem className="" value="milestone">Milestone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="">
              <Button size="default" variant="default" className="" type="submit">Add Event</Button>
            </DialogFooter>
              </DialogContent>
              
          </Dialog>
          
       </div>

       {/* Filters and View Navigation */}
       <Card className="">
         {/* Make CardContent flex-wrap for smaller screens */}
         <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:gap-0 sm:items-center sm:justify-between flex-wrap">
           {/* Month/Week/Day Navigation */}
           <div className="flex-1 flex items-center space-x-2 min-w-max"> {/* Prevent shrinking too much */}
              {/* Previous Button */}
              <Button size="default" variant="outline" className="" onClick={() => {
                  if (activeTab === 'month') handlePreviousMonth();
                  else if (activeTab === 'week') handlePreviousWeek();
                  else handlePreviousDay();
              }}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous {activeTab}</span>
              </Button>
              {/* Next Button */}
              <Button size="default" variant="outline" className="" onClick={() => {
                  if (activeTab === 'month') handleNextMonth();
                  else if (activeTab === 'week') handleNextWeek();
                  else handleNextDay();
              }}>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next {activeTab}</span>
              </Button>
              {/* Date Display */}
              <h2 className="text-lg font-semibold whitespace-nowrap">
                 {/* Display format depends on active tab */}
                 {activeTab === 'month' && month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                 {activeTab === 'week' && `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                 {activeTab === 'day' && date.toLocaleDateString("en-US", { weekday: 'long', month: "long", day: "numeric" })}
              </h2>
           </div>

           {/* Filters - Hide project filter if currentProjectId exists */} 
           {!currentProjectId && (
              <div className="flex items-center gap-2 min-w-[150px]"> {/* Min width for filter */} 
                    <Label htmlFor="project-filter" className="text-xs shrink-0">Project:</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger id="project-filter" className="h-8 text-xs">
                          <SelectValue placeholder="All Projects" />
                      </SelectTrigger>
                      <SelectContent className="">
                          <SelectItem className="" value="all">All Projects</SelectItem>
                          {projectTitles.map(title => (
                              <SelectItem className="" key={title} value={title}>{title}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
           )}

           {/* Event Type Filter - Keep this one */}
           <div className="flex items-center gap-2 min-w-[150px]"> {/* Min width for filter */} 
              <Label htmlFor="type-filter" className="text-xs shrink-0">Type:</Label>
              <Select value={selectedEventType} onValueChange={(value: string) => setSelectedEventType(value as CalendarEvent['type'] | 'all')}>
                  <SelectTrigger id="type-filter" className="h-8 text-xs">
                      <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="">
                      <SelectItem className="" value="all">All Types</SelectItem>
                      <SelectItem className="" value="task">Tasks</SelectItem>
                      <SelectItem className="" value="meeting">Meetings</SelectItem> 
                      <SelectItem className="" value="deadline">Deadlines</SelectItem>
                      <SelectItem className="" value="milestone">Milestones</SelectItem>
                  </SelectContent>
              </Select>
           </div>
         </CardContent>
       </Card>

       {/* Calendar Views */}
       <Tabs defaultValue="month" value={activeTab} onValueChange={setActiveTab} className="">
         <TabsList className="grid w-full grid-cols-3 sm:w-max"> {/* Adjust grid for mobile */}
           <TabsTrigger className="" value="month">Month</TabsTrigger>
           <TabsTrigger className="" value="week">Week</TabsTrigger>
           <TabsTrigger className="" value="day">Day</TabsTrigger>
         </TabsList>
         <TabsContent value="month" className="mt-4">
           <CalendarView events={events} month={month} />
         </TabsContent>
         <TabsContent value="week" className="mt-4">
           <WeekView events={events} date={date} />
         </TabsContent>
         <TabsContent value="day" className="mt-4">
           <DayView events={events} date={date} />
         </TabsContent>
       </Tabs>

       {/* Legend */}
       <div className="flex flex-wrap gap-2">
         {/* ... existing legend Badges ... */}
        <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300">
          Meeting
        </Badge>
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">
          Task
        </Badge>
        <Badge variant="default" className="bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-300">
          Deadline
        </Badge>
        <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-300">
          Milestone
        </Badge>
       </div>
    </div>
  )
}
