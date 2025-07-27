"use client"

import { Button } from "@/components/ui/button"
import { useGoogleAuth } from "@/hooks/authentication"
import { Google } from "@/icons"
import { Loader } from "../loader"
import { FaGoogle, FaGooglePlus } from "react-icons/fa6"

type GoogleAuthButtonProps = {
  method: "signup" | "signin"
}

export const GoogleAuthButton = ({ method }: GoogleAuthButtonProps) => {
  const { handleGoogleSignIn, isLoading } = useGoogleAuth()
  return (
    <Button
      onClick={handleGoogleSignIn}
      className="w-full rounded-2xl flex gap-3 bg-themeBlack border-themeGray"
      variant="outline"
    >
      <Loader loading={isLoading}>
        <FaGoogle className="text-xl" />
        {/* <FaGooglePlus />
        <Google /> */}
        Google
      </Loader>
    </Button>
  )
}
