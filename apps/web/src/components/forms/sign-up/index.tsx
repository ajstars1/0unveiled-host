"use client"
import { FormGenerator } from "@/components/global/form-generator"
import { Loader } from "@/components/global/loader"
import { Button } from "@/components/ui/button"
import { ZUNVEILED_CONSTANTS } from "@/constants"
import { useAuthSignUp } from "@/hooks/authentication"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MailCheck } from "lucide-react"

type Props = {}

const SignUpForm = (props: Props) => {
  const {
    form,
    handleSignUp,
    isLoading,
    showVerification,
  } = useAuthSignUp()

  return (
    <form
      onSubmit={form.handleSubmit(handleSignUp)}
      className="flex flex-col gap-3 mt-10"
    >
      {showVerification ? (
        <Alert className="bg-emerald-100 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100">
          <MailCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>Verification Email Sent!</AlertTitle>
          <AlertDescription>
            Please check your inbox (and spam folder) for a verification link to complete your registration.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {ZUNVEILED_CONSTANTS.signUpForm.map((field) => (
            <FormGenerator
              {...field}
              key={field.id}
              register={form.register}
              errors={form.formState.errors}
              name={field.name}
            />
          ))}
          <Button type="submit" className="rounded-2xl w-full mt-4" disabled={isLoading}>
            <Loader loading={isLoading}>Sign Up</Loader>
          </Button>
        </>
      )}
    </form>
  )
}

export default SignUpForm
