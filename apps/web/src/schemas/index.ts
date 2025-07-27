import { projectStatusEnum, projectVisibilityEnum, emailFrequencyEnum } from "@0unveiled/database"
import * as z from "zod"

const MaxFileSize = 2000000
const fileSize = (file: string) => {
  return -((file.length * 25) / 100 - file.length)
}

// export const profileFormSchema = z.object({
//   name: z
//     .string()
//     .min(2, {
//       message: "Name must be at least 2 characters.",
//     })
//     .max(30, {
//       message: "Name must not be longer than 30 characters.",
//     }),
//   username: z
//     .string()
//     .min(3, "Username must be at least 3 characters long")
//     .trim() // Remove whitespace from the beginning and end
//     .regex(
//       /^[a-zA-Z0-9_]+$/,
//       "Username can only contain letters, numbers, and underscores",
//     )
//     .toLowerCase() // Convert the username to lowercase
//     .refine((value) => !value.startsWith("_"), {
//       message: "Username cannot start with an underscore",
//     }),
//   email: z
//     .string({
//       required_error: "Please select an email to display.",
//     })
//     .email(),
//   coverImage: z.string().refine((file) => fileSize(file) < MaxFileSize, {
//     message: "Max upload size is 2MB.",
//   }),
//   image: z.string().refine((file) => fileSize(file) < MaxFileSize, {
//     message: "Max upload size is 2MB.",
//   }),
//   rollno: z.string().max(30, {
//     message: "Rollno. must not be longer than 30 characters.",
//   }),
//   bio: z
//     .string()
//     .max(160, {
//       message: "Bio must not be longer than 160 characters.",
//     })
//     .optional(),
//   // urls: z
//   //   .array(
//   //     z.object({
//   //       value: z.string().url({ message: "Please enter a valid URL." }),
//   //     })
//   //   )
//   //   .optional(),
//   skills: z.array(
//     z.object({
//       name: z.string().min(2, {
//         message: "Skill must be at least 2 characters.",
//       }),
//       experience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
//       rank: z.number().default(0),
//       // skillPostId: z.string().optional(),
//       userId: z.string(),
//     }),
//   ),
// })
export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  label: z.string().min(1, "Label is required"),
  // experience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  rank: z.number().optional(),
  value: z.string(),
  group: z.string().optional(),
})

export const skillsFormSchema = z.array(skillSchema).min(1, "At least one skill is required")

export const profileFormSchema = z.object({
  image: z.string().optional(),
  coverImage: z.string().optional(),
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .optional(),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username must be less than 30 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional().or(z.literal("")),
  websiteUrl: z.union([z.string().url({ message: "Please enter a valid URL." }), z.literal("")]).optional(),
  githubUrl: z.union([z.string().url({ message: "Invalid GitHub URL" }), z.literal("")]).optional(),
  linkedinUrl: z.union([z.string().url({ message: "Invalid LinkedIn URL" }), z.literal("")]).optional(),
  twitterUrl: z.union([z.string().url("Invalid URL"), z.literal("")]).optional(),
  college: z.string().min(1, { message: "College name is required." }).max(100, "College name cannot exceed 100 characters."),
  profilePicture: z.string().url({ message: "Invalid URL format" }).optional().or(z.literal("")),
  headline: z.string().max(150, "Headline cannot exceed 150 characters.").optional().or(z.literal("")),
  location: z.string().min(1, { message: "Location is required." }).max(100, "Location cannot exceed 100 characters."),
})

// export const skillsFormSchema = z.object({
//   skillsArray: z.array(
//     z.object({
//       name: z.string().min(2, {
//         message: "Skill must be at least 2 characters.",
//       }),
//       experience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
//       rank: z.number().default(0),
//       // skillPostId: z.string().optional(),
//       userId: z.string(),
//     }),
//   ),
// })

export const onboardingFormSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters long",
    })
    .trim() // Remove whitespace from the beginning and end
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .toLowerCase() // Convert the username to lowercase
    .refine((value) => !value.startsWith("_"), {
      message: "Username cannot start with an underscore",
    }),
  email: z
    .string()
    .email(),
  headline: z
    .string()
    .min(1, {
      message: "Headline is required.",
    })
    .max(150, {
      message: "Headline must not be longer than 150 characters.",
    }),
  skills: skillsFormSchema
})

export const postFormSchema = z
  .object({
    image: z
      .string()
      .refine((file) => fileSize(file) < MaxFileSize, {
        message: "Max upload size is 2MB.",
      })
      .optional(),
    skill: z.string(),
    newSkill: z.string().optional(),
    experience: z
      .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
      .optional(),
    about: z
      .string()
      .min(2, {
        message: "Description must be at least 2 characters.",
      })
      .max(600, {
        message: "Description must not be longer than 200 characters.",
      }),
    link: z.string().url({ message: "Please enter a valid URL." }).optional(),
    loves: z.number(),
    createdAt: z.date(),

    // urls: z
    //   .array(
    //     z.object({
    //       value: z.string().url({ message: "Please enter a valid URL." }),
    //     })
    //   )
    //   .optional(),
  })
  .refine(
    (data) => {
      if (data.skill === "other") {
        return !!data.newSkill
      }
      return true
    },
    {
      message: "Skill Name is required",
      path: ["newSkill"],
    },
  )
  .refine(
    (data) => {
      if (data.skill === "other") {
        return !!data.experience
      }
      return true
    },
    {
      message: "Experince Level is required",
      path: ["experience"],
    },
  )

export const collegeFormSchema = z.object({
  college: z.string().min(1, { message: "College is required." }),
  major: z.string().min(1, { message: "Major is required." }),
  graduationYear: z
    .string()
    .min(4, { message: "Graduation year is required." }),
})

// export const skillsFormSchema = z.object({
//   skillsArray: z.array(
//     z.object({
//       skill: z
//         .string()
//         .min(2, {
//           message: "Enter a Vaild Skill",
//         }),
//       url: z.string().url({ message: "Please enter a valid URL." }),
//       userId: z.string(),
//     })
//   ),
//   // urls: z.array(
//   //     z.object({
//   //       value: z.string().url({ message: "Please enter a valid URL." }),
//   //     })
//   //   )
//   //   .optional(),
// });

const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN'
} as const

export const SettingsSchema = z
  .object({
    name: z.optional(
      z.string().min(1, {
        message: "Name is required",
      }),
    ),
    email: z.optional(
      z.string().email({
        message: "Email is required",
      }),
    ),
    role: z.enum(['USER', 'ADMIN'] as const).optional(),
    // isTwoFactorEnabled: z.optional(z.boolean()),
    password: z.optional(z.string().min(6)),
    newPassword: z.optional(z.string().min(6)),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false
      }
    },
    {
      message: "New Password is required",
      path: ["newPassword"],
    },
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false
      }
      return true
    },
    {
      message: "Old Password is required",
      path: ["password"],
    },
  )

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
})

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
})

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  code: z.optional(z.string()),
})

export const RegisterSchema = z
  .object({
    email: z.string().email({
      message: "Email is required",
    }),
    password: z.string().min(6, {
      message: "Minimum 6 characters required",
    }),
    confirmPassword: z.string().min(6, {
      message: "Minimum 6 characters required",
    }),
    name: z.string().min(1, {
      message: "Name is required",
    }),
    username: z
      .string() // Define the type as string
      .min(3, "Username must be at least 3 characters long") // Minimum length
      .trim() // Remove whitespace from the beginning and end
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      )
      .toLowerCase() // Convert the username to lowercase
      .refine((value) => !value.startsWith("_"), {
        message: "Username cannot start with an underscore",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const ProfileOnboardingSchema = z.object({
  email: z.string().email("You must give a valid email"),
  username: z.string().min(3, {
    message: "Username must be atleast 3 characters long",
  }),
  about: z.string().min(10, {
    message: "About must be atleast 10 characters long",
  }),
  // password: z
  //   .string()
  //   .min(8, { message: "Your password must be atleast 8 characters long" })
  //   .max(64, {
  //     message: "Your password can not be longer then 64 characters long",
  //   })
  //   .refine(
  //     (value) => /^[a-zA-Z0-9_.-]*$/.test(value ?? ""),
  //     "password should contain only alphabets and numbers",
  //   ),
})

// Project Form Schema

// const ProjectStatus = z.enum(["OPEN", "CLOSED", "IN_PROGRESS", "COMPLETED"])
// const ProjectStage = z.enum([
//   "EARLY_STAGE",
//   "IN_DEVELOPMENT",
//   "NEARING_COMPLETION",
// ])

// const ProjectPositions = z.object({
//   // id: z.string().uuid(),
//   title: z.string(),
//   description: z.string().optional(),
// })

// const MAX_FILE_SIZE = 5000000 // 5MB
// const ACCEPTED_IMAGE_TYPES = [
//   "image/jpeg",
//   "image/jpg",
//   "image/png",
//   "image/webp",
// ]
// const ProjectSchema = z.object({
//   title: z.string().min(3, "Title must be at least 3 characters"),
//   shortSummary: z.string().min(10, "Summary must be at least 10 characters"),
//   description: z.string().min(50, "Description must be at least 50 characters"),
//   projectType: z.string().min(1, "Project type is required"),
//   teamSize: z.number().min(1, "Team size must be at least 1"),
//   projectStage: z.enum(["EARLY_STAGE", "IN_DEVELOPMENT", "NEARING_COMPLETION"]),
//   timeline: z.string().min(1, "Timeline is required"),
//   contactCreator: z.boolean(),
//   image: z
//     .any()
//     .refine((files) => files?.length === 1, "Image is required.")
//     .refine(
//       (files) => files?.[0]?.size <= MAX_FILE_SIZE,
//       "Max file size is 5MB.",
//     )
//     .refine(
//       (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
//       "Only .jpg, .jpeg, .png and .webp formats are supported.",
//     )
//     .optional(),
//   postions: z
//     .array(
//       z.object({
//         title: z.string(),
//         description: z.string().optional(),
//         skills: z.array(
//           z.string(),
//           // z.object({
//           //   name: z.string(),
//           // }),
//         ),
//       }),
//     )
//     .optional(),
//   requiredSkills: z
//     .array(
//       z.object({
//         name: z.string(),
//       }),
//     )
//     .min(1, "At least one skill is required"), // TODO: Check if this required id or not
//   jsonDescription: z.string().optional(),
//   htmlDescription: z.string().optional(),
//   status: ProjectStatus.optional(),
//   // projectType: z.string().min(3, {
//   //   message: "Project Type must be at least 3 characters.",
//   // }),
//   // teamSize: z.number().int(),
//   // projectPosts: z.array(ProjectPositions),  // TODO: Check if this is optional or not
//   // projectStage: ProjectStage,
//   // timeline: z.string(),
//   // contactCreator: z.boolean().default(true),
//   createdById: z.string().uuid(),
//   // createdBy: z.object({
//   //   id: z.string().uuid(),
//   //   name: z.string(),
//   // }),
//   members: z
//     .array(
//       z.object({
//         id: z.string().uuid(),
//         name: z.string(),
//       }),
//     )
//     .optional(),
//   channels: z
//     .array(
//       z.object({
//         id: z.string().uuid(),
//         name: z.string(),
//       }),
//     )
//     .optional(),
//   // requiredSkills: z
//   //   .array(
//   //     z.object({
//   //       id: z.string().uuid(),
//   //       name: z.string(),
//   //     }),
//   //   )
//   //   .optional(),
//   projectPosts: z
//     .array(
//       z.object({
//         id: z.string().uuid(),
//         content: z.string(),
//       }),
//     )
//     .optional(),
//   createdAt: z.date().default(() => new Date()),
//   updatedAt: z.date().default(() => new Date()),
// })

// export { ProjectSchema }

// Assuming these enums are defined in your Prisma schema
// const ProjectStatus = z.enum([
//   "PENDING",
//   "OPEN",
//   "CLOSED",
//   "IN_PROGRESS",
//   "COMPLETED",
//   "ARCHIVED",
// ])

const ApplicationStatus = z.enum(["PENDING", "APPROVED", "REJECTED"])

const ProjectStage = z.enum([
  "EARLY_STAGE",
  "IN_DEVELOPMENT",
  "NEARING_COMPLETION",
])

// --- Project Position Schema ---
// Removed unused ProjectPositionSchema

// --- Application Schema ---
const ApplicationSchema = z.object({
  id: z.string().uuid().optional(), // ID might be optional on creation
  userId: z.string().uuid(), // User applying (will be set on server)
  projectId: z.string().cuid(), // Changed to cuid, linked to project
  projectRoleId: z.string().cuid().optional(), // Changed to cuid, Link to the specific role being applied for
  note: z
    .string()
    .min(10, "Please provide a brief note (min 10 characters).")
    .max(1000, "Note cannot exceed 1000 characters.")
    .optional().or(z.literal("")), // Make note optional or allow empty string
  status: ApplicationStatus.default("PENDING"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// --- Main Project Schema (keeping only relevant parts for context) ---
// const ProjectSchema = z.object({ ... })

// --- Experience and Education Schemas --- 

// Define the education item schema (matching form inputs)
const educationSchema = z.object({
  id: z.string().optional(), // Optional ID for existing items
  institution: z.string().min(1, { message: "Institution name is required" }),
  degree: z.string().min(1, { message: "Degree is required" }),
  fieldOfStudy: z.string().min(1, { message: "Field of study is required" }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().max(500, "Description too long").optional(),
}).refine(data => !data.current ? !!data.endDate : true, {
  message: "End date is required unless currently studying",
  path: ["endDate"],
});

// Define the experience item schema (matching form inputs)
const experienceSchema = z.object({
  id: z.string().optional(), // Optional ID for existing items
  company: z.string().min(1, { message: "Company name is required" }),
  position: z.string().min(1, { message: "Position is required" }),
  location: z.string().max(100, "Location too long").optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().max(500, "Description too long").optional(),
}).refine(data => !data.current ? !!data.endDate : true, {
  message: "End date is required unless currently working here",
  path: ["endDate"],
});

// Define the schema for the entire form and EXPORT it
export const experienceEducationFormSchema = z.object({
  education: z.array(educationSchema).default([]),
  experience: z.array(experienceSchema).default([]),
});

// --- END: Added Experience and Education Schemas --- 
// Potentially import and export optionSchema if needed by portfolioItemSchema
export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  group: z.string().optional(),
  disable: z.boolean().optional(),
});


// Define and export the schema
export const portfolioItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  role: z.string().min(1, { message: "Role is required" }),
  projectUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal("")),
  skillsUsed: z.array(optionSchema).optional(), // Use the exported optionSchema
  imageUrls: z.array(z.string().url()).optional(), // Assuming URLs
  isGithubRepo: z.boolean().optional(),
  githubRepoUrl: z.string().url({ message: "Invalid GitHub URL" }).optional().or(z.literal("")),
});

export { ApplicationSchema }; // Export only the needed schema for now

  
// --- Create Project Form Schema ---
  
const roleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Role title must be at least 3 characters"),
  description: z.string().max(500, "Role description cannot exceed 500 characters").optional().or(z.literal("")),
  skills: z.array(optionSchema).min(1, "At least one skill is required for a role."),
});

// Create enum values for use in schemas
const ProjectVisibilityValues = ["PUBLIC", "PRIVATE"] as const;
const ProjectStatusValues = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"] as const;
const EmailFrequencyValues = ["IMMEDIATE", "DAILY", "WEEKLY", "NEVER"] as const;

export const createProjectFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title cannot exceed 100 characters"),
  publicSummary: z.string()
                  .min(10, "Public summary must be at least 10 characters")
                  .max(300, "Public summary cannot exceed 300 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  jsonDescription: z.any().optional(),
  htmlDescription: z.string().optional(),
  visibility: z.enum(ProjectVisibilityValues).default("PUBLIC"),
  status: z.enum(ProjectStatusValues).default("PLANNING"),
  requiredSkills: z.array(optionSchema)
                    .min(1, "At least one general project skill is required.")
                    .max(20, "Maximum 20 general skills allowed."),
  roles: z.array(roleSchema).optional().default([]),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
}).refine(data => {
    const cleanedHtml = data.htmlDescription?.replace(/<p><\/p>/g, '').replace(/<p>\s*<\/p>/g, '').trim();
    return cleanedHtml && cleanedHtml.length >= 10;
}, {
    message: "Description must contain at least 10 characters of actual content.",
    path: ["description"],
}).refine(data => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
}, {
    message: "End date must be on or after the start date.",
    path: ["endDate"],
});

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;

export const passwordSettingsSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your new password" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"], // Set error path to the confirmation field
});

// Add and export the Notification Settings Schema
export const notificationSettingsFormSchema = z.object({
  notifyMessages: z.boolean().default(true),
  notifyConnections: z.boolean().default(true),
  notifyProjects: z.boolean().default(true),
  notifyAchievements: z.boolean().default(true),
  notifyEvents: z.boolean().default(true),
  emailFrequency: z.enum(EmailFrequencyValues).default("IMMEDIATE"),
});

export type NotificationSettingsFormValues = z.infer<typeof notificationSettingsFormSchema>;
