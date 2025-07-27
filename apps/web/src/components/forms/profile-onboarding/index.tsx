"use client"

import { FormGenerator } from "@/components/global/form-generator"
import { Loader } from "@/components/global/loader"
import { Button } from "@/components/ui/button"
import { ZUNVEILED_CONSTANTS } from "@/constants"
import useOnboarding from "@/hooks/onboarding"

type Props = {}

const ProfileOnboardingForm = (props: Props) => {
  const { isPending, onProfileOnboard, register, errors } = useOnboarding()

  return (
    <form className="flex flex-col gap-3 mt-10" onSubmit={onProfileOnboard}>
      {ZUNVEILED_CONSTANTS.profileOnboardingForm.map((field) => (
        <FormGenerator
          {...field}
          key={field.id}
          register={register}
          errors={errors}
        />
      ))}
      <Button type="submit" className="rounded-2xl">
        <Loader loading={isPending}>Submit</Loader>
      </Button>
    </form>
  )
}

export default ProfileOnboardingForm
