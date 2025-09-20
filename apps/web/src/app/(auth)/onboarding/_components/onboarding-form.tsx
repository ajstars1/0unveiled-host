"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { onboardingFormSchema } from "@/schemas"
import { onboarding } from "@/actions/settings"

import { SKILLS_Beta } from "@/constants/skills"

import { useMutation } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import {  useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { FaSpinner } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import MultipleSelector, { Option } from "@/components/ui/multiple-selector"
import { ControllerRenderProps } from "react-hook-form"

type OnboardingFormValues = z.infer<typeof onboardingFormSchema>
const mockSearch = async (value: string): Promise<Option[]> => {
  return new Promise((resolve) => {
    const res = SKILLS_Beta.filter((option) => option.value.includes(value))
    resolve(res)
  })
}

export function OnboardingForm({
  email,
  id,
}: {
  email: string | undefined
  id: string
}) {
  const router = useRouter()
  // const isDesktop = useMediaQuery("(min-width: 768px)")

  const defaultValues: Partial<OnboardingFormValues> = {
    username: "",
    email: email,
    headline: "",
    skills: [],
    // skillsArray: [
    //   {
    //     name: "",
    //     experience: "BEGINNER",
    //     rank: 0,
    //     userId: id,
    //   },
    // ],
  }
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues,
    mode: "onChange",
  })

  // const { fields, append, remove } = useFieldArray({
  //   name: "skillsArray",
  //   control: form.control,
  // })

  const { mutate: InitiateLoginFlow, isPending } = useMutation({
    mutationFn: (values: OnboardingFormValues) =>
      onboarding(values, id)
        .then((data) => {
          if (data.error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: data.error,
            })
          }
          if (data.success) {
            toast({
              title: "Success",
              description: "You Profile is Created Successfully.",
            })
            router.push("/")
          }
        })
        .catch(() => toast({
          variant: "destructive",
          title: "Error",
          description: "Something went wrong. Please try again.",
        })),
  })

  function onSubmit(values: OnboardingFormValues) {
    InitiateLoginFlow(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "username"> }) => (
              <FormItem className="space-y-2">
                <FormLabel className="sr-only">Username</FormLabel>
                <FormControl>
                  <Input
                    className="w-full"
                    type="text"
                    placeholder="@username"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormDescription className="sr-only">
                  Your username is used to create your profile URL.
                </FormDescription>
                <FormMessage className="sr-only" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "email"> }) => (
              <FormItem className="space-y-2">
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input
                    className="w-full"
                    type="email"
                    disabled
                    placeholder="mail@college.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="sr-only">
                  This email is used to login to your account.
                </FormDescription>
                <FormMessage className="sr-only" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
                  name="headline"
                  render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "headline"> }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="sr-only">Headline</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g., Full Stack Developer | AI Enthusiast" className="w-full" type="text" /></FormControl>
                      <FormDescription className="sr-only">A short professional headline (max 150 chars).</FormDescription>
                      <FormMessage className="sr-only" />
                    </FormItem>
                  )}
          />
          {/* <div className="gap-4 grid grid-cols-1 col-span-1 md:col-span-2">
            {fields.map((field, index) => (
              <div key={field.id} className="gap-4 grid grid-cols-2 relative">

                <FormField
                  control={form.control}
                  name={`skillsArray.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-evenly">
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        Name of Skill
                      </FormLabel>
                      <FormDescription className={cn(index !== 0 && "sr-only")}>
                        Enter your Skill.
                      </FormDescription>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "md:w-[220px] overflow-hidden  justify-between break-normal md:break-all",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {(isDesktop &&
                                (field.value
                                  ? skills
                                      .flatMap((group) => group.skills)
                                      .find(
                                        (skill) => skill.value === field.value,
                                      )?.label || "Unknown Skill"
                                  : "Select Skill")) ||
                                (field.value
                                  ? skills
                                      .flatMap((group) => group.skills)
                                      .find(
                                        (skill) => skill.value === field.value,
                                      )?.label || "Unknown Skill"
                                  : "Select Skill"
                                ).split(" ")[0]}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Search Skill..." />

                            <CommandList aria-hidden>
                              <CommandEmpty>
                                Sorry we will add this skill soon!
                              </CommandEmpty>

                              {skills.map((skill) => (
                                <CommandGroup
                                  key={skill.group}
                                  heading={skill.group}
                                >
                                  {skill.skills.map((skill) => (
                                    <CommandItem
                                      value={skill.label}
                                      key={skill.value}
                                      onSelect={() => {
                                        form.setValue(
                                          `skillsArray.${index}.name`,
                                          skill.value,
                                        )
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          skill.value === field.value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {skill.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`skillsArray.${index}.experience`}
                  render={({ field }) => (
                    <FormItem className="relative w-fit md:w-[180px]">
                      <FormLabel className={cn(index !== 0 && "sr-only")}>
                        Experince
                      </FormLabel>
                      <FormDescription className={cn(index !== 0 && "sr-only")}>
                        Select your Experince Level.
                      </FormDescription>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger
                            disabled={isPending}
                            className="w-fit md:w-[180px]"
                          >
                            <SelectValue placeholder="Select an Experience Level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="BEGINNER">BEGINNER</SelectItem>
                            <SelectItem value="INTERMEDIATE">
                              INTERMEDIATE
                            </SelectItem>
                            <SelectItem value="ADVANCED">ADVANCED</SelectItem>
                            <SelectItem value="EXPERT">EXPERT</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {index !== 0 && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="absolute top-0 pt-1 -right-9 text-gray-600 hover:text-gray-800"
                          onClick={() => remove(index)}
                        >
                          <FaTrash />
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                append({
                  name: "",
                  experience: "BEGINNER",
                  rank: 0,
                  userId: id || "",
                })
              }
            >
              Add Skill
            </Button>
          </div> */}
          <FormField
            control={form.control}
            name="skills"
            render={({ field }: { field: ControllerRenderProps<OnboardingFormValues, "skills"> }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel className="sr-only">Skills</FormLabel>
                <FormControl>
                  {/* @ts-ignore */}
                  
                  <MultipleSelector
                    value={field.value?.map((skill: z.infer<typeof onboardingFormSchema>["skills"][number]) => ({
                      value: skill.value || skill.name,
                      label: skill.name,
                      group: skill.group || "Other",
                    }))}
                    onSearch={async (value) => {
                      const res = await mockSearch(value)
                      return res
                    }}
                    defaultOptions={[]}
                    creatable
                    groupBy="group"
                    placeholder="trying to search 'a' to get more options..."
                    onChange={(options) => {
                      field.onChange(
                        options.map((option) => ({
                          name: option.label,
                          value: option.value,
                          group: option.group,
                          rank: 0,
                        })),
                      )
                    }}
                    loadingIndicator={
                      <div className="w-full  flex flex-col gap-2  p-3">
                        <Skeleton className="w-[70%] h-2 animate-pulse" />
                        <Skeleton className="w-[60%] h-2 animate-pulse" />
                      </div>
                    }
                    emptyIndicator={
                      <p className="w-full text-center text-lg leading-10 text-muted-foreground">
                        no results found.
                      </p>
                    }
                  />
                </FormControl>
                <FormMessage className="sr-only" />
              </FormItem>
            )}
          />
        </div>
        <div className="flex">
          {isPending ? (
            <Button className="w-full" variant="default" size="default">
              <FaSpinner className="animate-spin" />
            </Button>
          ) : (
            <Button disabled={isPending} type="submit" className="w-full" variant="default" size="default">
              Create Profile
            </Button>
          )}
          <div></div>
        </div>
      </form>
    </Form>
  )
}