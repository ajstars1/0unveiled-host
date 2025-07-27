import { Button } from "@/components/ui/button"
import Link from "next/link"
import React from "react"
import { FaProjectDiagram, FaUser, FaUserCircle } from "react-icons/fa"
import { FaBook } from "react-icons/fa"

type NotFoundProps = {
  title: string
  description: string
  href?: string
  btnTitle?: string
  icon?: "project" | "book" | "avatar"
}

const NotFoundComp = ({
  title,
  description,
  href,
  btnTitle,
  icon,
}: NotFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
      {icon === "project" && (
        <FaProjectDiagram className="h-24 w-24 text-primary animate-pulse" />
      )}
      {icon === "book" && (
        <FaBook className="h-24 w-24 text-primary animate-pulse" />
      )}
      {icon === "avatar" && (
        <FaUserCircle className="h-24 w-24 text-primary animate-pulse" />
      )}

      <h2 className="text-2xl font-semibold text-foreground">
        No {title} found
      </h2>
      <p className="text-muted-foreground max-w-md text-center">
        {description}
      </p>
      {href && (
        <Link href={href}>
          <button>{btnTitle || "Go"}</button>
        </Link>
      )}
    </div>
  )
}

export default NotFoundComp
