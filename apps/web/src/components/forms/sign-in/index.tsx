"use client"

import { FormGenerator } from "@/components/global/form-generator"
import { Loader } from "@/components/global/loader"
import { Button } from "@/components/ui/button"
import { ZUNVEILED_CONSTANTS } from "@/constants"
import { useAuthSignIn } from "@/hooks/authentication"

type Props = {}

const SignInForm = (props: Props) => {
  const { form, handleSignIn, isLoading } = useAuthSignIn()
  const { register, formState: { errors } } = form

  return (
    <form className="flex flex-col gap-3 mt-10" onSubmit={form.handleSubmit(handleSignIn)}>
      {ZUNVEILED_CONSTANTS.signInForm.map((field) => (
        <FormGenerator
          {...field}
          key={field.id}
          register={register}
          errors={errors}
        />
      ))}
      <Button type="submit" className="rounded-2xl">
        <Loader loading={isLoading}>Sign In with Email</Loader>
      </Button>
    </form>
  )
}

export default SignInForm
