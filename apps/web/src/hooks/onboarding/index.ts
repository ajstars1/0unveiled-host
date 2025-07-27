import { profile, profileOnboarding } from "@/actions/settings"
import { ProfileOnboardingSchema } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { z } from "zod"

const useOnboarding = () => {
  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<z.infer<typeof ProfileOnboardingSchema>>({
    resolver: zodResolver(ProfileOnboardingSchema),
    mode: "onBlur",
  })

  const onFormSubmit = async (
    email: string,
    username: string,
    about: string,
  ) => {
    // const user = Prisma.users.findFirst({
    //     where: {
    //         email: email,
    //     }
    // })
    profileOnboarding({
      email: email,
      username: username,
      about: about,
    })
  }

  const { mutate: InitiateLoginFlow, isPending } = useMutation({
    mutationFn: ({
      email,
      username,
      about,
    }: {
      email: string
      username: string
      about: string
    }) => onFormSubmit(email, username, about),
  })

  const onProfileOnboard = handleSubmit(async (values) => {
    InitiateLoginFlow({
      email: values.email,
      username: values.username,
      about: values.about,
    })
  })

  return {
    register,
    errors,
    reset,
    isPending,
    onProfileOnboard,
  }
}

export default useOnboarding
