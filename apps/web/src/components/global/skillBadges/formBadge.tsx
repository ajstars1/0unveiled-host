"use client"
import { Badge } from "../../ui/badge"
import { SkillProp } from "@/data/skills"
import { FaXmark } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
// import { toast } from "sonner"
import { toast } from "@/hooks/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"

const SkillBadge = ({
  allSkills,
  disconnectSkill,
  userId, // Add this prop
}: {
  allSkills: SkillProp[]
  disconnectSkill?: (value: SkillProp) => Promise<
    | {
        error: string
        success?: undefined
      }
    | {
        success: string
        error?: undefined
      }
  >
  userId: string // Add this type
}) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (skill: SkillProp) => {
      if (!disconnectSkill) throw new Error("No disconnect function provided")
      return disconnectSkill(skill)
    },
    onMutate: async (removedSkill) => {
      // Update to use the correct query key with userId
      await queryClient.cancelQueries({ queryKey: ["skills", userId] })

      const previousSkills = queryClient.getQueryData(["skills", userId])

      // Update to use the correct query key
      queryClient.setQueryData(
        ["skills", userId],
        (old: SkillProp[] = []) =>
          old.filter((skill) => skill.id !== removedSkill.id),
      )

      return { previousSkills }
    },
    onError: (err, _, context) => {
      // Update to use the correct query key
      queryClient.setQueryData(["skills", userId], context?.previousSkills)
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to remove skill",
      })
    },
    onSuccess: (res) => {
      if (res.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: res.error,
        })
        return
      }
      // Update to use the correct query key
      queryClient.invalidateQueries({ queryKey: ["skills", userId] })
      toast({
        title: "Success",
        description: res.success,
      })
    },
  })

  const onhandleClick = async (skill: SkillProp) => {
    mutation.mutate(skill)
  }

  return (
    <div id="Skills-badge" className="flex gap-2 flex-wrap">
      {allSkills?.length === 0 && (
        <p className="text-sm text-slate-400 font-mono">No Skills added yet.</p>
      )}
      {allSkills?.map((skill) => (
        <span key={skill.id}>
          <Badge className="rounded-full group h-5 cursor-default hover:bg-black bg-slate-800">
            {skill.name}
            {disconnectSkill && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <FaXmark className="w-4 cursor-pointer h-4 ml-1 hover:h-5 " />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the skill from your profile. You can lose
                      all your progress related to this skill.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onhandleClick(skill)}
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending ? "Removing..." : "Continue"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </Badge>
        </span>
      ))}
    </div>
  )
}

export default SkillBadge
