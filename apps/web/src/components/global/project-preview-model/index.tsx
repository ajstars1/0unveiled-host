import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectProp } from "@/data/projects"
import { Loader2Icon } from "lucide-react"
import { useState } from "react"
import { Loader } from "../loader"

interface ProjectPreviewModalProps {
  project: ProjectProp | null
  onClose: () => void
}

export function ProjectPreviewModal({
  project,
  onClose,
}: ProjectPreviewModalProps) {
  const [loading, setLoading] = useState(true)
  if (!project) return null

  return (
    <Dialog open={!!project} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{project.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-6 overflow-hidden">
          {loading ? (
            //   <Loader2Icon className="  animate-spin w-[200px] h-[200px] " />
            <Loader
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              loading={loading}
            >
              <Loader2Icon className="w-32 h-32" />
            </Loader>
          ) : (
            <></>
          )}
          <iframe
            src={`${window.location.origin}/project/${project.id}`}
            className="w-full h-full rounded-md border"
            title={`Preview of ${project.title}`}
            onLoad={() => setLoading(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
