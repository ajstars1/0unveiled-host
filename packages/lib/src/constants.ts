export const APP_NAME = "0Unveiled"

export const APP_DESCRIPTION = "AI-Powered Platform for the Future"

export const CONTACT_EMAIL = "hello@0unveiled.com"

export const SOCIAL_LINKS = {
  twitter: "https://twitter.com/0unveiled",
  github: "https://github.com/0unveiled",
  linkedin: "https://linkedin.com/company/0unveiled",
} as const

export const API_ROUTES = {
  auth: {
    signIn: "/api/auth/signin",
    signUp: "/api/auth/signup",
    signOut: "/api/auth/signout",
    resetPassword: "/api/auth/reset-password",
  },
  user: {
    profile: "/api/user/profile",
    preferences: "/api/user/preferences",
  },
  ai: {
    generate: "/api/ai/generate",
    summarize: "/api/ai/summarize",
    analyze: "/api/ai/analyze",
  },
} as const

export const STORAGE_KEYS = {
  authToken: "0unveiled_auth_token",
  userPreferences: "0unveiled_user_preferences",
  theme: "0unveiled_theme",
} as const

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  profile: "/profile",
  settings: "/settings",
  pricing: "/pricing",
  about: "/about",
  contact: "/contact",
  auth: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    resetPassword: "/auth/reset-password",
  },
} as const

export const LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  maxTextLength: 10000,
} as const 