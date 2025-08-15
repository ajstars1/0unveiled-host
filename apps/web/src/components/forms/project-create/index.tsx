"use client"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  shortSummary: z.string().min(10, "Summary must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  projectType: z.string().min(1, "Project type is required"),
  teamSize: z.number().min(1, "Team size must be at least 1"),
  projectStage: z.enum(["EARLY", "IN_DEVELOPMENT", "NEARING_COMPLETION"]),
  timeline: z.string().min(1, "Timeline is required"),
  contactCreator: z.boolean(),
  projectPosts: z
    .array(
      z.object({
        title: z.string(),
        skills: z.array(z.string()),
      }),
    )
    .optional(),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
})

function CreateProject() {
  const router = useRouter()
  const [skillInput, setSkillInput] = useState("")
  const [positionInput, setPositionInput] = useState("")
  const [positionSkillInput, setPositionSkillInput] = useState("")
  const [positions, setPositions] = useState<
    { title: string; skills: string[] }[]
  >([])

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      contactCreator: true,
      requiredSkills: [],
      teamSize: 1,
      projectStage: "EARLY",
    },
  })

  function onSubmit(values: z.infer<typeof projectSchema>) {
    // Here you would typically make an API call to create the project
    router.push("/")
  }

  const addSkill = (skill: string) => {
    if (skill && !form.getValues().requiredSkills.includes(skill)) {
      form.setValue("requiredSkills", [
        ...form.getValues().requiredSkills,
        skill,
      ])
      setSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    form.setValue(
      "requiredSkills",
      form
        .getValues()
        .requiredSkills.filter((skill) => skill !== skillToRemove),
    )
  }

  const addPosition = () => {
    if (positionInput && positionSkillInput) {
      const newPosition = {
        title: positionInput,
        skills: positionSkillInput.split(",").map((s) => s.trim()),
      }
      setPositions([...positions, newPosition])
      form.setValue("projectPosts", [...positions, newPosition])
      setPositionInput("")
      setPositionSkillInput("")
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        <Card className="p-6">
          <h1 className="text-3xl font-bold tracking-tight mb-8">
            Create New Project
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shortSummary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Summary</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief project summary" {...field} />
                    </FormControl>
                    <FormDescription>
                      A concise overview of your project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed project description"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WEB_APP">
                            Web Application
                          </SelectItem>
                          <SelectItem value="MOBILE_APP">
                            Mobile Application
                          </SelectItem>
                          <SelectItem value="DESKTOP_APP">
                            Desktop Application
                          </SelectItem>
                          <SelectItem value="API">API Service</SelectItem>
                          <SelectItem value="DATA_SCIENCE">
                            Data Science
                          </SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="projectStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Stage</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EARLY">Early Stage</SelectItem>
                        <SelectItem value="IN_DEVELOPMENT">
                          In Development
                        </SelectItem>
                        <SelectItem value="NEARING_COMPLETION">
                          Nearing Completion
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeline</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 6 months" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Label>Required Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a required skill"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill(skillInput)
                      }
                    }}
                  />
                  <Button type="button" onClick={() => addSkill(skillInput)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.getValues().requiredSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Open Positions</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    value={positionInput}
                    onChange={(e) => setPositionInput(e.target.value)}
                    placeholder="Position title"
                  />
                  <Input
                    value={positionSkillInput}
                    onChange={(e) => setPositionSkillInput(e.target.value)}
                    placeholder="Required skills (comma-separated)"
                  />
                </div>
                <Button type="button" onClick={addPosition}>
                  Add Position
                </Button>
                <div className="space-y-2">
                  {positions.map((position, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="font-medium">{position.title}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {position.skills.map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default CreateProject
