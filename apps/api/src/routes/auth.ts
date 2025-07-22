import { Router } from "express";
import { z } from "zod";

const router = Router();

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Sign up
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password: _password, name } = signUpSchema.parse(req.body);

    // TODO: Implement user registration with Supabase
    res.status(201).json({
      message: "User created successfully",
      user: { email, name },
    });
  } catch (error) {
    next(error);
  }
});

// Sign in
router.post("/signin", async (req, res, next) => {
  try {
    const { email, password: _password } = signInSchema.parse(req.body);

    // TODO: Implement user authentication with Supabase
    res.json({
      message: "Sign in successful",
      user: { email },
      token: "placeholder-token",
    });
  } catch (error) {
    next(error);
  }
});

// Sign out
router.post("/signout", async (req, res, next) => {
  try {
    // TODO: Implement sign out logic
    res.json({
      message: "Sign out successful",
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
