// import { z } from "zod"

// export const signInSchema = z.object({
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

// src/components/forms/login/schema.ts

import * as z from "zod"

// Defines the validation schema for the login form using Zod.
export const signInSchema = z.object({
  // Email must be a valid email format.
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  // Password must be at least 8 characters long.
  // You might want to align this minimum length with Supabase's requirements (default is 6).
  password: z.string().min(6, { // Changed from 8 to 6 to match Supabase default
    message: "Password must be at least 6 characters long.",
  }),
})

// TypeScript type inferred from the signInSchema.
export type SignInSchema = z.infer<typeof signInSchema>

