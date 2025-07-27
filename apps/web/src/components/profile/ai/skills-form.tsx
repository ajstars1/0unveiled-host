"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { X, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// Type definitions
interface Skill {
  id: string
  name: string
  category?: string
}

// Mock API functions
const fetchUserSkills = async (userId: string): Promise<Skill[]> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: "1", name: "React", category: "Frontend" },
        { id: "2", name: "Node.js", category: "Backend" },
        { id: "3", name: "TypeScript", category: "Language" },
        { id: "4", name: "AWS", category: "Cloud" },
      ])
    }, 500)
  })
}

const addSkill = async (userId: string, skillName: string, category?: string): Promise<Skill> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `skill-${Date.now()}`,
        name: skillName,
        category,
      })
    }, 500)
  })
}

const removeSkill = async (userId: string, skillId: string): Promise<{ success: boolean }> => {
  // In a real app, this would be an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true })
    }, 500)
  })
}

interface SkillsFormProps {
  userId: string
}

export default function SkillsForm({ userId }: SkillsFormProps) {
  const queryClient = useQueryClient()
  const [newSkill, setNewSkill] = useState("")
  const [newCategory, setNewCategory] = useState("")

  // Fetch user skills
  const { data: skills = [], isLoading } = useQuery({
    queryKey: ["userSkills", userId],
    queryFn: () => fetchUserSkills(userId),
  })

  // Add skill mutation with optimistic updates
  const addSkillMutation = useMutation({
    mutationFn: (skillData: { userId: string; skillName: string; category?: string }) =>
      addSkill(skillData.userId, skillData.skillName, skillData.category),
    onMutate: async (newSkillData) => {
      await queryClient.cancelQueries({ queryKey: ["userSkills", userId] })

      const previousSkills = queryClient.getQueryData<Skill[]>(["userSkills", userId]) || []

      // Optimistically add the new skill
      queryClient.setQueryData<Skill[]>(["userSkills", userId], (old) => [
        ...(old || []),
        {
          id: `temp-${Date.now()}`,
          name: newSkillData.skillName,
          category: newSkillData.category,
        },
      ])

      return { previousSkills }
    },
    onError: (err, newSkill, context) => {
      queryClient.setQueryData(["userSkills", userId], context?.previousSkills)
      toast({
        title: "Error",
        description: "Failed to add skill. Please try again.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      setNewSkill("")
      setNewCategory("")
      toast({
        title: "Success",
        description: "Skill added successfully.",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userSkills", userId] })
    },
  })

  // Remove skill mutation with optimistic updates
  const removeSkillMutation = useMutation({
    mutationFn: (skillData: { userId: string; skillId: string }) => removeSkill(skillData.userId, skillData.skillId),
    onMutate: async (removedSkillData) => {
      await queryClient.cancelQueries({ queryKey: ["userSkills", userId] })

      const previousSkills = queryClient.getQueryData<Skill[]>(["userSkills", userId]) || []

      // Optimistically remove the skill
      queryClient.setQueryData<Skill[]>(["userSkills", userId], (old) =>
        (old || []).filter((skill) => skill.id !== removedSkillData.skillId),
      )

      return { previousSkills }
    },
    onError: (err, removedSkill, context) => {
      queryClient.setQueryData(["userSkills", userId], context?.previousSkills)
      toast({
        title: "Error",
        description: "Failed to remove skill. Please try again.",
        variant: "destructive",
      })
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Skill removed successfully.",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userSkills", userId] })
    },
  })

  const handleAddSkill = () => {
    if (!newSkill.trim()) return

    // Check for duplicates
    if (skills.some((skill) => skill.name.toLowerCase() === newSkill.toLowerCase())) {
      toast({
        title: "Duplicate Skill",
        description: "This skill is already in your list.",
        variant: "destructive",
      })
      return
    }

    addSkillMutation.mutate({
      userId,
      skillName: newSkill.trim(),
      category: newCategory.trim() || undefined,
    })
  }

  const handleRemoveSkill = (skillId: string) => {
    removeSkillMutation.mutate({ userId, skillId })
  }

  if (isLoading) {
    return <div>Loading skills...</div>
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-2xl font-semibold mb-4">Skills</h2>
        <Separator className="mb-6" />

        <div className="mb-4">
          <div className="flex gap-2 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Add a new skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Category (optional)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
              />
            </div>
            <Button onClick={handleAddSkill} disabled={addSkillMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <span className="mr-1">{skill.name}</span>
                {skill.category && <span className="text-xs text-gray-500 mr-1">({skill.category})</span>}
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="text-gray-500 hover:text-red-500"
                  disabled={removeSkillMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {skills.length === 0 && <p className="text-gray-500">No skills added yet. Add your first skill above.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
