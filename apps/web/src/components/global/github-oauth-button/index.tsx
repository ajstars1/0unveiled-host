"use client"

import { Button } from "@/components/ui/button"
import { useGithubAuth } from "@/hooks/authentication"
import { Loader } from "../loader"
import { FaGithub } from "react-icons/fa6"

type GithubAuthButtonProps = {
  method: "signup" | "signin"
}

export const GithubAuthButton = ({ method }: GithubAuthButtonProps) => {
  const { handleGithubSignIn, isLoading } = useGithubAuth()
  return (
    <Button
      onClick={handleGithubSignIn}
      className="w-full rounded-2xl flex gap-3 bg-themeBlack border-themeGray"
      variant="outline"
    >
      <Loader loading={isLoading}>
        <FaGithub className="text-xl" />
        GitHub
      </Loader>
    </Button>
  )
} 