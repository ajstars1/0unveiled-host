"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (formData: FormData) => Promise<void>
}

export function AddProjectModal({ isOpen, onClose, onAdd }: AddProjectModalProps) {
  const [title, setTitle] = useState("")
  const [role, setRole] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState("")
  const [description, setDescription] = useState("")
  const [link, setLink] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 2. Check the validation condition
    const isFormValid = title && role && skills.length > 0 && description;

    if (isFormValid) {
      setIsSubmitting(true);

      try {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("roleInItem", role);
        formData.append("description", description);
        formData.append("url", link || "");
        formData.append("skills", JSON.stringify(skills));
        

        await onAdd(formData);


        // reset form state after successful submission
        setTitle("");
        setRole("");
        setSkills([]);
        setSkillInput("");
        setDescription("");
        setLink("");

        onClose(); 

      } catch (error) {
        console.error("Error inside handleSubmit:", error); // 6. Catches any errors
      } finally {
        setIsSubmitting(false);
      }
    } else {
    }
  };


  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   if (title && role && skills.length > 0 && description) {
  //     setIsSubmitting(true)

  //     try {
  //       const formData = new FormData()
  //       formData.append("title", title)
  //       formData.append("roleInItem", role)
  //       formData.append("description", description)
  //       formData.append("url", link || "")
  //       formData.append("skills", JSON.stringify(skills))

  //       await onAdd(formData)

  //       // Reset form
  //       setTitle("")
  //       setRole("")
  //       setSkills([])
  //       setSkillInput("")
  //       setDescription("")
  //       setLink("")
  //     } catch (error) {
  //       console.error("Error adding project:", error)
  //     } finally {
  //       setIsSubmitting(false)
  //     }
  //   }
  // }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addSkill()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="">
          <DialogTitle className="">Add Project Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="">Project Title *</Label>
            <Input type="text" id="title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required className="mt-1" />
          </div>

          <div>
            <Label htmlFor="role" className="">Your Role *</Label>
            <Input type="text" id="role" value={role} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRole(e.target.value)} required className="mt-1" />
          </div>

          <div>
            <Label className="" htmlFor="skills">Key Skills Used *</Label>
            <div className="mt-1 space-y-2">
              <Input
                type="text"
                id="skills"
                value={skillInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a skill and press Enter"
                className="mt-1"
              />
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="" htmlFor="description">Brief Description of Your Contribution *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              required
              className="mt-1"
              rows={3}
              placeholder="1-2 sentences about your contribution"
            />
          </div>

          <div>
            <Label className="" htmlFor="link">Project Link (Optional)</Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLink(e.target.value)}
              className="mt-1"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button size="default" variant="outline" type="button" onClick={onClose} className="bg-white text-black hover:bg-gray-100">
              Cancel
            </Button>
            <Button
              size="default"
              variant="default"
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isSubmitting || !title || !role || skills.length === 0 || !description}
            >
              {isSubmitting ? "Adding..." : "Add Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
