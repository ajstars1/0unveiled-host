// import { z } from "zod"

// export const signUpSchema = z.object({
//   firstName: z
//     .string()
//     .min(3, { message: "first name must be atleast 3 characters" }),
//   lastName: z
//     .string()
//     .min(3, { message: "last name must be atleast 3 characters" }),
//   email: z.string().email("You must give a valid email"),
//   password: z
//     .string()
//     .min(8, { message: "Your password must be atleast 8 characters long" })
//     .max(64, {
//       message: "Your password can not be longer then 64 characters long",
//     })
//     .refine(
//       (value) => /^[a-zA-Z0-9_.-]*$/.test(value ?? ""),
//       "password should contain only alphabets and numbers",
//     ),
// })


import * as z from "zod"

// Defines the validation schema for the register form using Zod.
export const signUpSchema = z
  .object({
    // Email must be a valid email format.
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    // Password must be at least 6 characters long (matching Supabase default).
    password: z.string().min(6, {
      message: "Password must be at least 6 characters long.",
    }),
    // Confirm password field.
    confirmPassword: z.string(),
    // Optional first name (add if you collect this on the signup form)
    firstName: z
      .string()
      .min(1, { message: "First name is required." })
      .optional(),
    // Optional last name (add if you collect this on the signup form)
    lastName: z.string().optional(),
  })
  // Refinement checks if password and confirmPassword match.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"], // Error message will be associated with the confirmPassword field
  })

// TypeScript type inferred from the signUpSchema.
export type SignUpSchema = z.infer<typeof signUpSchema>
